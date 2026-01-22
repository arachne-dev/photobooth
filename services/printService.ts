const PRINT_SERVER_URL = 'http://localhost:3002';

export async function checkPrinterStatus(): Promise<{ connected: boolean; message: string }> {
  try {
    const response = await fetch(`${PRINT_SERVER_URL}/api/printer/status`);
    return await response.json();
  } catch (error) {
    return { connected: false, message: '프린트 서버에 연결할 수 없습니다' };
  }
}

export async function printImage(imageData: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${PRINT_SERVER_URL}/api/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: '프린트 요청 실패' };
  }
}
