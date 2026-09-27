const { app, BrowserWindow, net, protocol, session } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

protocol.registerSchemesAsPrivileged([{
  scheme: 'riva',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
}])

const distDir = path.resolve(__dirname, '..', 'dist')
const devUrl = process.env.ELECTRON_RENDERER_URL

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#101413',
    title: 'RIVA Cocina',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event, url) => {
    const allowed = devUrl ? url.startsWith(`${devUrl}/`) : url.startsWith('riva://app/')
    if (!allowed) event.preventDefault()
  })

  if (devUrl) {
    window.loadURL(`${devUrl}/#/kds`)
  } else {
    window.loadURL('riva://app/index.html#/kds')
  }
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  if (!devUrl) {
    protocol.handle('riva', (request) => {
      const requested = decodeURIComponent(new URL(request.url).pathname)
      const filePath = path.resolve(distDir, `.${requested === '/' ? '/index.html' : requested}`)
      if (!filePath.startsWith(`${distDir}${path.sep}`)) {
        return new Response('Ruta no permitida', { status: 403 })
      }
      return net.fetch(pathToFileURL(filePath).toString())
    })
  }
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
