import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  NativeModules,
  NativeEventEmitter,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';

const { VpnModule } = NativeModules;
const vpnEmitter = new NativeEventEmitter(VpnModule);

const App = () => {
  const [isVpnRunning, setIsVpnRunning] = useState(false);
  const [packets, setPackets] = useState([]);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    http: 0,
    https: 0,
    totalSize: 0,
  });

  useEffect(() => {
    // Paket yakalama event listener
    const subscription = vpnEmitter.addListener('onPacketCaptured', (packetJson) => {
      try {
        const packet = JSON.parse(packetJson);
        addPacket(packet);
      } catch (e) {
        console.error('Paket parse hatası:', e);
      }
    });

    return () => subscription.remove();
  }, []);

  const addPacket = (packet) => {
    const newPacket = {
      id: Date.now() + Math.random(),
      ...packet,
      timestamp: new Date(packet.timestamp).toISOString(),
    };

    setPackets(prev => [newPacket, ...prev].slice(0, 500));
    
    setStats(prev => ({
      total: prev.total + 1,
      http: packet.protocol === 'HTTP' ? prev.http + 1 : prev.http,
      https: packet.protocol === 'HTTPS' ? prev.https + 1 : prev.https,
      totalSize: prev.totalSize + (packet.size || 0),
    }));
  };

  const startVpn = async () => {
    try {
      await VpnModule.startVpn();
      setIsVpnRunning(true);
      Alert.alert('Başarılı', 'Network trafiği izleniyor');
    } catch (error) {
      Alert.alert('Hata', error.message || 'VPN başlatılamadı');
    }
  };

  const stopVpn = async () => {
    try {
      await VpnModule.stopVpn();
      setIsVpnRunning(false);
      Alert.alert('Durduruldu', 'Network trafiği izleme durduruldu');
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  const clearPackets = () => {
    Alert.alert(
      'Temizle',
      'Tüm paketleri silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet',
          onPress: () => {
            setPackets([]);
            setSelectedPacket(null);
            setStats({ total: 0, http: 0, https: 0, totalSize: 0 });
          },
        },
      ]
    );
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const filteredPackets = packets.filter(p =>
    !filter ||
    (p.destIP && p.destIP.includes(filter)) ||
    (p.url && p.url.toLowerCase().includes(filter.toLowerCase())) ||
    (p.host && p.host.toLowerCase().includes(filter.toLowerCase())) ||
    (p.method && p.method.toLowerCase().includes(filter.toLowerCase()))
  );

  const renderPacketItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.packetItem,
        selectedPacket?.id === item.id && styles.packetItemSelected,
      ]}
      onPress={() => setSelectedPacket(item)}>
      <View style={styles.packetHeader}>
        <View style={styles.packetHeaderLeft}>
          <View style={[
            styles.methodBadge,
            item.protocol === 'HTTPS' ? styles.methodBadgeHttps : styles.methodBadgeHttp,
          ]}>
            <Text style={styles.methodText}>{item.protocol || 'TCP'}</Text>
          </View>
          {item.method && (
            <View style={styles.methodBadge}>
              <Text style={styles.methodText}>{item.method}</Text>
            </View>
          )}
        </View>
        <Text style={styles.portText}>:{item.destPort}</Text>
      </View>
      
      <Text style={styles.urlText} numberOfLines={1}>
        {item.host || item.destIP}
        {item.url || ''}
      </Text>
      
      <View style={styles.packetFooter}>
        <Text style={styles.infoText}>{formatBytes(item.size)}</Text>
        <Text style={styles.infoText}>{item.destIP}</Text>
        <Text style={styles.infoText}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌐 Network Analyzer</Text>
        <View style={[styles.statusBadge, isVpnRunning && styles.statusBadgeActive]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {isVpnRunning ? 'İzleniyor' : 'Durduruldu'}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isVpnRunning ? styles.buttonStop : styles.buttonStart]}
          onPress={isVpnRunning ? stopVpn : startVpn}>
          <Text style={styles.buttonText}>
            {isVpnRunning ? '⏸️ Durdur' : '▶️ Başlat'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonClear} onPress={clearPackets}>
          <Text style={styles.buttonText}>🗑️ Temizle</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.http}</Text>
          <Text style={styles.statLabel}>HTTP</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.https}</Text>
          <Text style={styles.statLabel}>HTTPS</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#06b6d4' }]}>{formatBytes(stats.totalSize)}</Text>
          <Text style={styles.statLabel}>Boyut</Text>
        </View>
      </View>

      {/* Filter */}
      <TextInput
        style={styles.filterInput}
        placeholder="🔍 IP, URL, method ile filtrele..."
        placeholderTextColor="#6b7280"
        value={filter}
        onChangeText={setFilter}
      />

      {/* Packet List */}
      <View style={styles.packetListContainer}>
        <Text style={styles.sectionTitle}>
          📦 Yakalanan Paketler ({filteredPackets.length})
        </Text>
        <FlatList
          data={filteredPackets}
          renderItem={renderPacketItem}
          keyExtractor={item => item.id.toString()}
          style={styles.packetList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isVpnRunning
                  ? 'Paket bekleniyor...'
                  : 'VPN\'i başlatın ve herhangi bir uygulamayı kullanın'}
              </Text>
            </View>
          }
        />
      </View>

      {/* Packet Details */}
      {selectedPacket && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <Text style={styles.sectionTitle}>📋 Paket Detayları</Text>
            <TouchableOpacity onPress={() => setSelectedPacket(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.detailsScroll}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Protocol:</Text>
              <Text style={styles.detailValue}>{selectedPacket.protocol}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Source IP:</Text>
              <Text style={styles.detailValue}>{selectedPacket.sourceIP}:{selectedPacket.sourcePort}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dest IP:</Text>
              <Text style={styles.detailValue}>{selectedPacket.destIP}:{selectedPacket.destPort}</Text>
            </View>
            {selectedPacket.host && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Host:</Text>
                <Text style={styles.detailValue}>{selectedPacket.host}</Text>
              </View>
            )}
            {selectedPacket.method && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Method:</Text>
                <Text style={styles.detailValue}>{selectedPacket.method}</Text>
              </View>
            )}
            {selectedPacket.url && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>URL:</Text>
                <Text style={styles.detailValue}>{selectedPacket.url}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Size:</Text>
              <Text style={styles.detailValue}>{formatBytes(selectedPacket.size)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Timestamp:</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedPacket.timestamp).toLocaleString()}
              </Text>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeActive: {
    backgroundColor: '#10b981',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonStart: {
    backgroundColor: '#10b981',
  },
  buttonStop: {
    backgroundColor: '#ef4444',
  },
  buttonClear: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  filterInput: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
  },
  packetListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  packetList: {
    flex: 1,
  },
  packetItem: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  packetItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
  },
  packetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  packetHeaderLeft: {
    flexDirection: 'row',
    gap: 6,
  },
  methodBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  methodBadgeHttp: {
    backgroundColor: '#f59e0b',
  },
  methodBadgeHttps: {
    backgroundColor: '#10b981',
  },
  methodText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  portText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  urlText: {
    color: '#60a5fa',
    fontSize: 14,
    marginBottom: 8,
  },
  packetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: {
    color: '#6b7280',
    fontSize: 11,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  detailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsScroll: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 14,
    width: 100,
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
});

export default App;