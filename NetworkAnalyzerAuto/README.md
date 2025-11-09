# 🌐 Network Analyzer Pro - Android

HTTP/HTTPS ağ trafiğini gerçek zamanlı yakalayan Android uygulaması. Tüm uygulamaların network isteklerini izleyin!

## ✨ Özellikler

- ✅ **Tüm uygulamaların** network trafiğini yakalar
- ✅ **HTTP/HTTPS** protokol desteği
- ✅ **Oyun trafiği** otomatik tespit
- ✅ **Gerçek zamanlı** paket analizi
- ✅ **IP, URL, Method** görüntüleme
- ✅ **Arka planda** çalışma
- ✅ **VPN tabanlı** trafik yakalama
- ✅ **Filtre sistemi**
- ✅ **Detaylı paket bilgileri**

## 🎯 Kullanım Alanları

- Mobil uygulama geliştirme ve debug
- API isteklerini inceleme
- Oyun trafiği analizi
- Network performans testi
- Güvenlik araştırmaları

## 📱 Ekran Görüntüleri

- Ana ekran ile tüm paketleri görün
- Her pakete tıklayarak detayları inceleyin
- Gerçek zamanlı istatistikler
- HTTP/HTTPS ayrımı

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+
- React Native CLI
- Android Studio
- JDK 11+
- Android SDK 21+ (Android 5.0+)

### Adımlar

1. **Projeyi klonla:**
```bash
git clone https://github.com/KULLANICI_ADIN/NetworkAnalyzerApp.git
cd NetworkAnalyzerApp
```

2. **Paketleri yükle:**
```bash
npm install
```

3. **Android cihazı bağla veya emulator başlat**

4. **Uygulamayı çalıştır:**
```bash
npx react-native run-android
```

## 📦 APK Oluşturma

### Manuel:
```bash
cd android
./gradlew assembleRelease
```

APK konumu: `android/app/build/outputs/apk/release/app-release.apk`

### Otomatik (GitHub Actions):
- Kodu GitHub'a push et
- Actions sekmesinde build tamamlanır
- Releases'den APK'yı indir

## 🔒 Gerekli İzinler

- `INTERNET` - Network erişimi
- `BIND_VPN_SERVICE` - VPN servisi oluşturma
- `FOREGROUND_SERVICE` - Arka plan servisi
- `ACCESS_NETWORK_STATE` - Network durumu kontrolü

## 📱 Kullanım Kılavuzu

1. **Uygulamayı aç**
2. **"Başlat"** butonuna tıkla
3. **VPN iznini onayla** (Android sistem ayarı)
4. **Herhangi bir uygulamayı kullan** (oyun, tarayıcı, vb.)
5. **Network trafiğini gerçek zamanlı gör**
6. **Pakete tıkla** ve detayları incele

## 🎮 Oyun Trafiği Analizi

Uygulama otomatik olarak oyun trafiğini tespit eder:
- API endpoint'leri
- Asset yüklemeleri
- Player bilgileri
- Sunucu iletişimi
- WebSocket bağlantıları

## 🛠️ Teknik Detaylar

### Mimari
- **React Native** - UI Framework
- **VPN Service** - Android native trafik yakalama
- **Java Bridge** - Native ve JavaScript iletişimi
- **Packet Analysis** - TCP/IP paket analizi

### Paket Yakalama
- VPN interface oluşturur
- Tüm network trafiği VPN'den geçer
- TCP paketleri analiz edilir
- HTTP/HTTPS istekleri ayrıştırılır
- React Native'e real-time gönderilir

## ⚠️ Uyarı

Bu uygulama **eğitim ve geliştirme** amaçlıdır. 

- ✅ Kendi uygulamalarınızı test etmek için kullanın
- ✅ Network debug ve geliştirme için kullanın
- ❌ Üçüncü taraf uygulamaların izinsiz analizini yapmayın
- ❌ Başkalarının gizliliğini ihlal etmeyin

## 🔐 Güvenlik Notları

- Uygulama HTTPS trafiğini tam olarak deşifre edemez (SSL pinning)
- Sadece header ve metadata bilgilerini görebilir
- Şifreli içerikler korunur
- Local cihazda çalışır, dışarı veri göndermez

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing`)
5. Pull Request açın

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🆘 Destek

Sorun mu yaşıyorsunuz? 
- GitHub Issues açın
- Pull Request gönderin
- Dokümantasyonu inceleyin

## 🎓 Öğrenme Kaynakları

- [React Native Docs](https://reactnative.dev/)
- [Android VPN Service](https://developer.android.com/reference/android/net/VpnService)
- [TCP/IP Packet Analysis](https://en.wikipedia.org/wiki/Transmission_Control_Protocol)

## 🌟 Yıldız Vermeyi Unutmayın!

Bu proje işinize yaradıysa GitHub'da ⭐ vermeyi unutmayın!

---

**Made with ❤️ for Network Analysis**