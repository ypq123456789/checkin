const glados = async () => {
  const cookie = process.env.GLADOS
  const pushplusToken = process.env.NOTIFY  // 确保您已经设置了这个环境变量

  if (!cookie) return ['Error', 'No cookie provided']

  try {
    const headers = {
      'cookie': cookie,
      'referer': 'https://glados.rocks/console/checkin',
      'user-agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
    }

    // Checkin request
    const checkinResponse = await fetch('https://glados.rocks/api/user/checkin', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: '{"token":"glados.network"}',
    })
    const checkin = await checkinResponse.json()
    console.log('Checkin response:', JSON.stringify(checkin, null, 2))

    if (!checkin.message) {
      throw new Error('Unexpected checkin response format')
    }

    // Status request
    const statusResponse = await fetch('https://glados.rocks/api/user/status', {
      method: 'GET',
      headers,
    })
    const status = await statusResponse.json()
    console.log('Status response:', JSON.stringify(status, null, 2))

    // Parse leftDays from the response
    let leftDays = 'Unknown'
    if (status.code === 0 && status.data && status.data.leftDays) {
      leftDays = parseFloat(status.data.leftDays).toFixed(2)
    } else {
      console.warn('Could not find leftDays in the response or unexpected response format')
    }

    const message = [
      'Checkin OK',
      `${checkin.message}`,
      `Left Days ${leftDays}`,
    ]

    // PushPlus notification
    if (pushplusToken) {
      const pushplusResponse = await fetch(`http://www.pushplus.plus/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: pushplusToken,
          title: 'GLaDOS Checkin',
          content: message.join('\n'),
        }),
      })
      const pushplusResult = await pushplusResponse.json()
      console.log('PushPlus response:', JSON.stringify(pushplusResult, null, 2))
    } else {
      console.log('No PushPlus token provided, skipping notification')
    }

    return message
  } catch (error) {
    console.error('Error in glados function:', error)
    const errorMessage = [
      'Checkin Error',
      `${error}`,
      `<${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}>`,
    ]

    // Send error notification via PushPlus
    if (pushplusToken) {
      try {
        const pushplusResponse = await fetch(`http://www.pushplus.plus/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: pushplusToken,
            title: 'GLaDOS Checkin Error',
            content: errorMessage.join('\n'),
          }),
        })
        const pushplusResult = await pushplusResponse.json()
        console.log('PushPlus error notification response:', JSON.stringify(pushplusResult, null, 2))
      } catch (pushError) {
        console.error('Failed to send error notification via PushPlus:', pushError)
      }
    }

    return errorMessage
  }
}
