import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/* ⚠️ Demo 用途：API Key 請勿提交至公開 repo。 */
const AI_API_KEY = 'sk-vS9otASWtxTpeUaqE758Fb343411476cA8E5Fb41Fc3a1597';
const AI_ENDPOINT = 'https://free.v36.cm/v1/chat/completions';

export interface GeminiPromoCopyParams {
  name: string;
  startDate: string;
  endDate: string;
  minAmount?: number;
  gifts?: string[];
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  constructor(private http: HttpClient) {}

  /** 一鍵生成促銷活動文案 */
  generatePromoCopy(params: GeminiPromoCopyParams): Observable<string> {
    const minText  = params.minAmount ? `\n消費門檻：NT$${params.minAmount}` : '';
    const giftText = params.gifts?.length ? `\n贈品選項：${params.gifts.join('、')}` : '';
    const prompt =
      `你是一位專業的台式餐廳行銷文案師。請為以下促銷活動撰寫一段吸引人的正體中文文案（80-120字），` +
      `語氣親切溫暖，突出優惠重點，結尾帶有行動呼籲。\n\n` +
      `活動名稱：${params.name}\n活動期間：${params.startDate} 至 ${params.endDate}` +
      `${minText}${giftText}\n\n直接輸出文案內容，不要加標題、編號或說明文字。`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`
    });

    return this.http.post<any>(AI_ENDPOINT, {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.85
    }, { headers }).pipe(
      map(res => res?.choices?.[0]?.message?.content?.trim() ?? '生成失敗，請稍後再試')
    );
  }
}
