package com.networkanalyzerapp;

import android.content.Intent;
import android.net.VpnService;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import androidx.annotation.Nullable;

public class VpnModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;

    VpnModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "VpnModule";
    }

    @ReactMethod
    public void startVpn(Promise promise) {
        Intent intent = VpnService.prepare(reactContext);
        if (intent != null) {
            // VPN izni gerekiyor
            getCurrentActivity().startActivityForResult(intent, 0);
            promise.reject("PERMISSION_REQUIRED", "VPN izni gerekli");
        } else {
            // VPN'i başlat
            Intent serviceIntent = new Intent(reactContext, LocalVpnService.class);
            serviceIntent.setAction(LocalVpnService.ACTION_START);
            reactContext.startService(serviceIntent);
            promise.resolve("VPN başlatıldı");
        }
    }

    @ReactMethod
    public void stopVpn(Promise promise) {
        Intent serviceIntent = new Intent(reactContext, LocalVpnService.class);
        serviceIntent.setAction(LocalVpnService.ACTION_STOP);
        reactContext.startService(serviceIntent);
        promise.resolve("VPN durduruldu");
    }

    public static void sendEvent(String eventName, @Nullable String params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}