const glados = async () => {
  const cookie = process.env.GLADOS
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

    // Flexible parsing of leftDays
    let leftDays = 'Unknown'
    if (status.data && status.data.leftDays) {
      leftDays = Number(status.data.leftDays)
    } else if (status.leftDays) {
      leftDays = Number(status.leftDays)
    } else {
      console.warn('Could not find leftDays in the response')
    }

    return [
      'Checkin OK',
      `${checkin.message}`,
      `Left Days ${leftDays}`,
    ]
  } catch (error) {
    console.error('Error in glados function:', error)
    return [
      'Checkin Error',
      `${error}`,
      `<${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}>`,
    ]
  }
}
