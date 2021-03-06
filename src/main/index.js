const { app, shell, BrowserWindow } = require('electron')
const isWin = (process.platform === 'win32')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 784,
    center: true
  })

  mainWindow.loadFile('index.html')
  
  // a tag でリンクを開く時、デフォルトのブラウザで表示する
  mainWindow.webContents.on('new-window', function (event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });

  if (process.env.NODE_ENV === 'dev') { mainWindow.webContents.openDevTools() }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  if (isWin) {
    mainWindow.on('app-command', (e, cmd) => {
      if (cmd === 'browser-backward' && mainWindow.webContents.canGoBack()) {
          mainWindow.webContents.goBack()
        }
    })
  }
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
