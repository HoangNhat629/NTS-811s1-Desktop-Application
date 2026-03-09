# NTS-811s1 Desktop Application

A modern, secure desktop application built with Tauri, React, and Rust for network device management and monitoring.

## 🚀 Overview

NTS-811s1 Desktop App is a cross-platform desktop application designed for managing and monitoring NTS-811s1 network devices. The application provides a comprehensive interface for device configuration, connection management, and real-time monitoring with advanced security features.

## ✨ Features

### 🔐 Authentication & Security
- **Secure Login System**: JWT-based authentication with token management
- **Idle Timeout**: Automatic logout after 30 seconds of inactivity
- **Session Management**: Smart session handling with app close/reopen detection
- **Session Timeout**: 5-second grace period for app reopening

### 🌐 Connection Management
- **Host Discovery**: Add and manage multiple device connections
- **Real-time Ping Monitoring**: Continuous connectivity checking with status indicators
- **Connection History**: Persistent storage of recent connections
- **TCP Session Management**: Reliable connection establishment and monitoring

### ⚙️ Device Configuration
- **Radio Configuration**: Complete radio settings management
- **Frequency Table (FREQ)**: Advanced frequency configuration
- **Cryptographic Table**: Secure cryptographic settings
- **Settings Persistence**: Automatic saving and restoration of configurations

### 🎨 User Interface
- **Modern Design**: Clean, professional interface with Bootstrap styling
- **Responsive Layout**: Optimized for desktop usage
- **Multi-language Support**: Internationalization ready (i18n)
- **Dark Theme**: Consistent theming throughout the application
- **Toast Notifications**: User-friendly feedback system

### 🔧 Technical Features
- **Cross-platform**: Windows, macOS, and Linux support
- **Native Performance**: Rust backend for optimal performance
- **Real-time Updates**: Live status monitoring and updates
- **Error Handling**: Comprehensive error management and user feedback
- **Data Persistence**: Local storage for settings and session data

## 🛠️ Technology Stack

### Frontend
- **React 19**: Modern React with hooks and concurrent features
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing
- **Redux Toolkit**: State management
- **Bootstrap 5**: Responsive UI framework
- **React i18next**: Internationalization
- **Axios**: HTTP client for API communication

### Backend
- **Tauri 2**: Modern desktop application framework
- **Rust**: High-performance systems programming
- **Tokio**: Asynchronous runtime
- **Serde**: Serialization framework

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Type safety (planned)
- **Vite Dev Server**: Hot reload development
- **Tauri CLI**: Application building and bundling

## 📁 Project Structure

```
nts_811s1_desktop_app/
├── src/                          # Frontend source code
│   ├── assets/                   # Static assets
│   │   ├── css/                  # Stylesheets
│   │   ├── Fonts/                # Custom fonts
│   │   └── Images/               # Image assets
│   ├── component/                # Reusable React components
│   │   ├── BatteryComponent.jsx
│   │   ├── CustomOclock.jsx
│   │   ├── HeaderComponent.jsx
│   │   ├── NewSessionModal.jsx
│   │   ├── SaveAllProgress.jsx
│   │   ├── SettingComponent.jsx
│   │   └── Sidebar.jsx
│   ├── context/                  # React context providers
│   │   ├── IdleTimeoutContext.jsx
│   │   ├── OutletDisableContext.jsx
│   │   ├── SaveAllProgressContext.jsx
│   │   └── SessionTimeoutContext.jsx
│   ├── helper/                   # Utility functions
│   │   ├── hostHelper.jsx
│   │   └── settingHelper.jsx
│   ├── hooks/                    # Custom React hooks
│   │   ├── useBattery.jsx
│   │   ├── useDefaultDataMode.jsx
│   │   └── useThemeWatcher.jsx
│   ├── pages/                    # Page components
│   │   ├── Connection/           # Connection management
│   │   ├── Login.jsx             # Authentication
│   │   ├── LoadingPage.jsx       # Loading states
│   │   └── System/               # Main application pages
│   │       ├── SettingPage.jsx
│   │       ├── FREQPage.jsx
│   │       ├── RadioPage.jsx
│   │       └── CryptoTable.jsx
│   ├── routing/                  # Routing configuration
│   ├── utils/                    # Utility functions
│   │   ├── axiosConfig.jsx
│   │   └── i18n.jsx
│   ├── App.jsx                   # Main application component
│   └── main.jsx                  # Application entry point
├── src-tauri/                    # Tauri backend
│   ├── src/
│   │   ├── main.rs               # Application entry point
│   │   └── lib.rs                # Core application logic
│   ├── tauri.conf.json           # Tauri configuration
│   └── Cargo.toml                # Rust dependencies
├── public/                       # Public assets
├── dist/                         # Build output (generated)
└── package.json                  # Node.js dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable version)
- **Tauri CLI**: `npm install -g @tauri-apps/cli`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nts_811s1_desktop_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

4. **Build for production**
   ```bash
   npm run tauri build
   ```

## 🔧 Configuration

### Environment Variables

The application uses the following configuration:

- **Development URL**: `http://localhost:5173`
- **Window Size**: 1475x800 (minimum)
- **App Identifier**: `nts.811s1.desktop`

### Tauri Configuration

Key settings in `src-tauri/tauri.conf.json`:
- Window dimensions and constraints
- Bundle configuration
- Security policies
- Plugin configurations

## 🔒 Security Features

### Authentication
- JWT token-based authentication
- Secure token storage in local storage
- Automatic token cleanup on logout

### Timeout Management
- **Idle Timeout**: 30 seconds of inactivity triggers logout
- **Session Timeout**: 5-second grace period on app close
- **Activity Monitoring**: Tracks user interactions (clicks, keyboard, scroll)

### Data Protection
- Sensitive data stored securely
- Automatic cleanup on session expiration
- Secure API communication

## 🌐 API Integration

The application communicates with NTS-811s1 devices via REST API:

- **Base URL**: Configurable per connection
- **Authentication**: Bearer token
- **Endpoints**: Device configuration, status monitoring, data retrieval

## 🎯 Usage

### First Time Setup
1. Launch the application
2. Login with credentials
3. Add device connection in Connection page
4. Configure device settings

### Daily Operation
1. Select or add device connection
2. Monitor connection status (green = online, red = offline)
3. Navigate to different configuration sections
4. Save changes automatically or manually

### Connection Management
- **Add Connection**: Click "New Session..." to add new device
- **Test Connection**: Automatic ping monitoring shows status
- **Switch Connections**: Click on any saved connection
- **Delete Connection**: Right-click or use delete button

## 🐛 Troubleshooting

### Common Issues

**Application won't start**
- Ensure all prerequisites are installed
- Check Node.js and Rust versions
- Verify Tauri CLI installation

**Connection fails**
- Verify device IP address and port
- Check network connectivity
- Ensure device is powered on and accessible

**Settings not saving**
- Check local storage permissions
- Verify write access to application data directory

### Debug Mode
- Use browser dev tools (F12) for frontend debugging
- Check console logs for detailed error messages
- Tauri provides additional logging in development mode

## 📦 Build & Deployment

### Development Build
```bash
npm run tauri dev
```

### Production Build
```bash
npm run tauri build
```

### Distribution
The build process creates platform-specific installers:
- Windows: `.msi` installer
- macOS: `.dmg` disk image
- Linux: `.deb` or `.AppImage` packages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit a pull request

### Code Style
- Follow React and Rust best practices
- Use ESLint for JavaScript/React code
- Follow Rust formatting guidelines
- Write comprehensive commit messages

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Check the troubleshooting section
- Review application logs
- Contact the development team

## 🔄 Version History

### v1.0.0
- Initial release
- Basic connection management
- Device configuration interface
- Security features implementation
- Cross-platform support

---

**Built with ❤️ using Tauri, React, and Rust**
