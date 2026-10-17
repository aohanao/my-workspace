const { workspaceUrl } = require('../../config')

Page({
  data: { url: workspaceUrl },
  onLoad() {
    if (!workspaceUrl) {
      wx.showToast({ title: '工作台网址未配置', icon: 'none' })
      wx.navigateBack()
    }
  },
})
