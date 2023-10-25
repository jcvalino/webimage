import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  console.log('url: ', encodeURIComponent(url));

  let browser;
  try {
    const dateStart = new Date();
    browser = await puppeteer.launch({
      headless: 'new',
    });
    const page = await browser.newPage();
    await page.goto(url);
    const screenshot = await page.screenshot({ type: 'png' });
    const dateEnd = new Date();

    // @ts-expect-error
    const ms = Math.abs(dateEnd - dateStart);
    console.log('ms: ', ms);

    const init = {
      headers: {
        'Content-Type': 'image/png',
      },
    };

    return new Response(screenshot, init);
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 200 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
