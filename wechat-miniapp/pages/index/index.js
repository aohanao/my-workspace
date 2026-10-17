const { workspaceUrl } = require('../../config')

Page({
  data: { configured: Boolean(workspaceUrl) },
  openWorkspace() {
    if (!workspaceUrl) {
      wx.showToast({ title: '请先配置工作台网址', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/workspace/workspace' })
  },
})
