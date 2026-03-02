# Configuração de Push Notifications (Offline)

Para enviar notificações mesmo com o app fechado, siga estes passos.

## 1. Gerar chaves VAPID

```bash
deno run https://raw.githubusercontent.com/negrel/webpush/master/cmd/generate-vapid-keys.ts
```

Saída esperada:
- Uma linha JSON (objeto com `publicKey` e `privateKey` em formato JWK)
- Uma linha com `your application server key is: <base64url>`

## 2. Variáveis de ambiente

### Frontend (`.env.local`)

```
VITE_VAPID_PUBLIC_KEY=<o application server key da saída acima>
```

### Supabase Edge Function (secret)

```bash
supabase secrets set VAPID_PRIVATE_KEY='<o JSON completo da primeira linha>'
```

Exemplo do JSON:
```json
{"publicKey":{"kty":"EC","crv":"P-256","x":"...","y":"..."},"privateKey":{"kty":"EC","crv":"P-256","d":"...","x":"...","y":"..."}}
```

## 3. Migration e deploy

```bash
# Aplicar migration da tabela push_subscriptions
supabase db push

# Deploy da Edge Function
supabase functions deploy send-push
```

## 4. Database Webhook

No [Supabase Dashboard](https://supabase.com/dashboard) → **Database** → **Webhooks**:

1. **Create webhook**
2. **Webhook configuration**: Supabase Edge Functions
3. **Edge Function**: `send-push`, método POST
4. **Conditions**: tabela `notifications`, evento **Insert**
5. **HTTP Headers**: Add auth header with service key (padrão)
6. Salvar

## 5. Testar

1. Ative as notificações em **Configurações** no app
2. Feche o app (ou abra em outra aba)
3. Peça para alguém curtir seu post ou comentar
4. A notificação deve aparecer no sistema operacional
