package com.networkanalyzerapp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import org.json.JSONObject;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LocalVpnService extends VpnService {
    private static final String TAG = "LocalVpnService";
    public static final String ACTION_START = "START";
    public static final String ACTION_STOP = "STOP";
    private static final String CHANNEL_ID = "VpnServiceChannel";

    private ParcelFileDescriptor vpnInterface;
    private ExecutorService executorService;
    private boolean isRunning = false;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_START.equals(action)) {
                startVpn();
            } else if (ACTION_STOP.equals(action)) {
                stopVpn();
            }
        }
        return START_STICKY;
    }

    private void startVpn() {
        if (isRunning) return;

        createNotificationChannel();
        startForeground(1, createNotification());

        // VPN interface oluştur
        Builder builder = new Builder();
        builder.setMtu(1500);
        builder.addAddress("10.0.0.2", 32);
        builder.addRoute("0.0.0.0", 0);
        builder.addDnsServer("8.8.8.8");
        builder.setSession("Network Analyzer");
        
        vpnInterface = builder.establish();

        if (vpnInterface == null) {
            Log.e(TAG, "VPN interface oluşturulamadı");
            return;
        }

        isRunning = true;
        executorService = Executors.newFixedThreadPool(2);
        
        // Paket okuma thread'i
        executorService.execute(() -> {
            FileInputStream inputStream = new FileInputStream(vpnInterface.getFileDescriptor());
            FileChannel inputChannel = inputStream.getChannel();
            ByteBuffer buffer = ByteBuffer.allocate(32767);

            try {
                while (isRunning) {
                    buffer.clear();
                    int length = inputChannel.read(buffer);
                    
                    if (length > 0) {
                        buffer.flip();
                        byte[] packet = new byte[length];
                        buffer.get(packet);
                        
                        // Paketi analiz et
                        analyzePacket(packet);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Paket okuma hatası", e);
            }
        });

        Log.i(TAG, "VPN başlatıldı");
    }

    private void analyzePacket(byte[] packet) {
        try {
            // IP header analizi
            if (packet.length < 20) return;

            int versionAndIHL = packet[0] & 0xFF;
            int version = (versionAndIHL >> 4) & 0x0F;
            int ihl = (versionAndIHL & 0x0F) * 4;

            if (version != 4) return; // Sadece IPv4

            int protocol = packet[9] & 0xFF;
            
            // Kaynak ve hedef IP
            String sourceIP = String.format("%d.%d.%d.%d",
                packet[12] & 0xFF, packet[13] & 0xFF,
                packet[14] & 0xFF, packet[15] & 0xFF);
            
            String destIP = String.format("%d.%d.%d.%d",
                packet[16] & 0xFF, packet[17] & 0xFF,
                packet[18] & 0xFF, packet[19] & 0xFF);

            // TCP paketi (protocol = 6)
            if (protocol == 6 && packet.length >= ihl + 20) {
                int sourcePort = ((packet[ihl] & 0xFF) << 8) | (packet[ihl + 1] & 0xFF);
                int destPort = ((packet[ihl + 2] & 0xFF) << 8) | (packet[ihl + 3] & 0xFF);

                // HTTP/HTTPS portları (80, 443, 8080 vb.)
                if (destPort == 80 || destPort == 443 || destPort == 8080 || 
                    sourcePort == 80 || sourcePort == 443 || sourcePort == 8080) {
                    
                    // Paket bilgilerini JSON olarak oluştur
                    JSONObject packetData = new JSONObject();
                    packetData.put("timestamp", System.currentTimeMillis());
                    packetData.put("protocol", destPort == 443 ? "HTTPS" : "HTTP");
                    packetData.put("sourceIP", sourceIP);
                    packetData.put("destIP", destIP);
                    packetData.put("sourcePort", sourcePort);
                    packetData.put("destPort", destPort);
                    packetData.put("size", packet.length);
                    packetData.put("isSecure", destPort == 443);

                    // HTTP header analizi
                    if (destPort == 80 && packet.length > ihl + 20) {
                        String httpData = new String(packet, ihl + 20, packet.length - ihl - 20);
                        if (httpData.startsWith("GET") || httpData.startsWith("POST") || 
                            httpData.startsWith("PUT") || httpData.startsWith("DELETE")) {
                            
                            String[] lines = httpData.split("\r\n");
                            if (lines.length > 0) {
                                String[] requestLine = lines[0].split(" ");
                                if (requestLine.length >= 2) {
                                    packetData.put("method", requestLine[0]);
                                    packetData.put("url", requestLine[1]);
                                }
                                
                                // Host header bul
                                for (String line : lines) {
                                    if (line.startsWith("Host: ")) {
                                        packetData.put("host", line.substring(6));
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // React Native'e gönder
                    VpnModule.sendEvent("onPacketCaptured", packetData.toString());
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Paket analiz hatası", e);
        }
    }

    private void stopVpn() {
        isRunning = false;
        
        if (executorService != null) {
            executorService.shutdownNow();
        }
        
        if (vpnInterface != null) {
            try {
                vpnInterface.close();
            } catch (Exception e) {
                Log.e(TAG, "VPN kapatma hatası", e);
            }
        }
        
        stopForeground(true);
        stopSelf();
        Log.i(TAG, "VPN durduruldu");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Network Analyzer Service",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Network Analyzer")
            .setContentText("Ağ trafiği izleniyor...")
            .setSmallIcon(android.R.drawable.ic_menu_info_details)
            .setContentIntent(pendingIntent)
            .build();
    }

    @Override
    public void onDestroy() {
        stopVpn();
        super.onDestroy();
    }
}