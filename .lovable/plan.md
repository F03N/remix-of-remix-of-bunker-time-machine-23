

## التشخيص

المشكلة الأساسية ليست في الكود بل في **اتصال الـ backend** — طلبات المصادقة (`/auth/v1/token`) تفشل بخطأ `Failed to fetch` و الـ backend يرد بـ 544 (timeout). هذا يسبب:

1. **تعليق زر Sign In** على "Processing..." لفترة طويلة قبل ظهور الخطأ
2. **تحذيرات Auth Lock** — القفل لا يُحرر خلال 5 ثوانٍ فيتم كسره بالقوة
3. **فشل تحديث الجلسة** — refresh token يفشل عند تحميل الصفحة

## الحل

### 1. إضافة Timeout لتسجيل الدخول في AuthPage
حالياً `handleSubmit` ينتظر بلا حد زمني. سنضيف timeout 10 ثوانٍ مع رسالة خطأ واضحة بالعربي/الإنجليزي.

### 2. إضافة زر Retry ورسالة خطأ واضحة
عند فشل الاتصال، نعرض رسالة "الاتصال بالسيرفر بطيء — حاول مرة أخرى" بدل الرسالة التقنية `Failed to fetch`.

### 3. معالجة Auth Lock في Index.tsx
إضافة `AbortController` أو catch لخطأ `Lock broken by steal` حتى لا يظهر كـ unhandled rejection.

### 4. تحسين رسائل الخطأ
ترجمة `Failed to fetch` إلى رسالة مفهومة للمستخدم.

---

### التفاصيل التقنية

**`src/components/AuthPage.tsx`** — handleSubmit:
```typescript
// Wrap auth call with 10s timeout
const result = await Promise.race([
  supabase.auth.signInWithPassword({ email, password }),
  new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000))
]);
```
- Catch `TIMEOUT` → toast "Connection slow, please retry"
- Catch `Failed to fetch` → toast "Server unreachable, check connection"

**`src/pages/Index.tsx`** — Auth init:
- Add global handler for `AbortError: Lock broken by steal` to suppress unhandled rejection noise

**No database or backend changes needed** — this is purely frontend resilience.

