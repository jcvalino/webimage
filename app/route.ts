import { NextResponse } from 'next/server';

import { kv } from '@vercel/kv';
import { put } from '@vercel/blob';

import puppeteer from 'puppeteer';

const init = {
  headers: {
    'Content-Type': 'image/png',
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageUrl = searchParams.get('url');
  const width = Number(searchParams.get('width'));
  const height = Number(searchParams.get('height'));

  if (!pageUrl) {
    return NextResponse.json(
      { error: 'url parameter is required' },
      { status: 400 }
    );
  }

  if (!width) {
    return NextResponse.json(
      { error: 'width parameter is required' },
      { status: 400 }
    );
  }

  if (!height) {
    return NextResponse.json(
      { error: 'height parameter is required' },
      { status: 400 }
    );
  }

  const imageUrl = await kv.get<string | null>(encodeURIComponent(request.url));

  if (imageUrl) {
    try {
      const imageBlob = await fetch(imageUrl).then((r) => r.blob());
      return new Response(imageBlob, init);
    } catch {
      await kv.del(encodeURIComponent(request.url));
    }
  }

  let browser;
  let stepOne = false;
  let stepTwo = false;
  let stepThree = false;
  let stepFour = false;
  let stepFive = false;
  let stepSix = false;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      defaultViewport: {
        width,
        height,
      },
    });
    stepOne = true;
    const page = await browser.newPage();
    stepTwo = true;
    await page.goto(decodeURIComponent(pageUrl));
    stepThree = true;
    const screenshot = await page.screenshot({ type: 'png' });
    stepFour = true;

    const { url: storedImageUrl } = await put(
      encodeURIComponent(request.url),
      screenshot,
      {
        access: 'public',
      }
    );
    stepFive = true;

    await kv.set(encodeURIComponent(request.url), storedImageUrl);
    stepSix = true;
    return new Response(screenshot, init);
  } catch (error) {
    return NextResponse.json(
      // { error: 'Something went wrong' },
      {
        error: JSON.stringify({
          error,
          meta: {
            stepOne,
            stepTwo,
            stepThree,
            stepFour,
            stepFive,
            stepSix,
          },
        }),
      },
      { status: 200 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
