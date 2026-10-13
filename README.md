# 🏃‍♂️ Race Predictor PRO (Web / PWA)

Aplicação Web Progressiva (PWA) de predição científica de tempos de prova de corrida, integrando:

1. **Strava API Oficial (OAuth 2.0)**: Sincronização e modelagem fisiológica individual a partir das corridas das **últimas 24 semanas** (macrociclo de treinamento do atleta).
2. **Análise Topográfica de GPX**: Parser vetorial de arquivos `.gpx` com decomposição de altimetria e modelo metabólico de corrida em aclives e declives (**Alberto Minetti, 2002**).
3. **Meteorologia de Alta Resolução**: Integração horária via **Open-Meteo** (temperatura, umidade relativa, ponto de orvalho via Magnus-Tetens, velocidade e azimute vetorial de vento).
4. **Planejamento de Prova Km a Km**: Tabela de parciais (*Grade Adjusted Pace*), estratégias de ritmo (*Even Effort*, *Even Pace*, *Negative Split*) e geração de **Pulseira de Passagens (Pace Band)** pronta para impressão.

---

## 🔬 Modelos Científicos e Fisiológicos

- **Índice VDOT (Jack Daniels & Jimmy Gilbert, 1979)**:
  - Estima a potência aeróbica ($VO_2\text{max}$ equivalente) a partir das melhores marcas do atleta no ciclo de 24 semanas.
- **Curva de Fadiga Individualizada (Pete Riegel, 1981)**:
  - Equação: $T_2 = T_1 \cdot \left(\frac{D_2}{D_1}\right)^b$.
  - O expoente de fadiga $b$ é calibrado individualmente a partir da relação entre as marcas de 5K e 10K e ajustado pelo volume médio semanal e pela maior rodagem contínua (longão).
- **Custo Energético de Inclinação (Alberto Minetti et al., 2002)**:
  - Determina o gasto metabólico instantâneo em subidas e descidas:
    $$C_r(i) = 155.4 \cdot i^5 - 30.4 \cdot i^4 - 43.3 \cdot i^3 + 46.3 \cdot i^2 + 19.5 \cdot i + 3.6 \quad \text{(J/kg/m)}$$
  - Ajusta o ritmo por km mantendo a demanda cardiovascular uniforme (*Even Effort*).
- **Impacto Térmico & Ponto de Orvalho (Magnus-Tetens / Ely et al., 2007)**:
  - Modela o estresse cardiovascular quando a temperatura do ar supera $12^\circ\text{C}$ e quando o ponto de orvalho excede $16^\circ\text{C}$, limitando o resfriamento evaporativo por suor.
- **Decomposição Vetorial Aerodinâmica (Pugh, 1970 / Davies, 1980)**:
  - Calcula a componente de vento relativo $v_{\text{efetivo}} = v_{\text{vento}} \cdot \cos(\theta_{\text{rumo}} - \theta_{\text{vento}})$, ponderando o custo de vento contra vs. vento a favor.
- **Diretrizes Nutricionais e Hídricas (Jeukendrup, 2014 / ACSM, 2007)**:
  - Estima reposição de carboidratos (g/h), taxa de hidratação (ml/h), reposição de sódio e indicação dos quilômetros exatos para ingestão de géis energéticos.

---

## 🚀 Instalação e Execução Local

### Pré-requisitos
- **Node.js** 20.x ou superior
- **npm** ou **yarn** / **pnpm**

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU_USUARIO/race-predictor.git
   cd race-predictor
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Copie o arquivo de exemplo e configure suas chaves:
   ```bash
   cp .env.example .env.local
   ```
   Abra `.env.local` e configure seu `STRAVA_CLIENT_ID` e `STRAVA_CLIENT_SECRET`.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no navegador: [http://localhost:3050](http://localhost:3050).

5. **Para build de produção:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🔑 Configuração da API do Strava

1. Acesse o painel de desenvolvedor do Strava: [https://www.strava.com/settings/api](https://www.strava.com/settings/api).
2. Crie ou configure seu aplicativo.
3. No campo **Authorization Callback Domain**, preencha com o domínio sem protocolo nem porta:
   - Para testes locais: `localhost`
   - Para produção (ex: Vercel): `seu-dominio.vercel.app`
4. Copie o **Client ID** e o **Client Secret** para o seu `.env.local`.

---

## 📱 Progressive Web App (PWA)

- **Instalação Nativa**: Suporte a instalação como aplicativo standalone no Android (Chrome/Edge) e iOS (Safari > "Adicionar à Tela de Início").
- **Offline First**: Service Worker configurado em `public/sw.js` com cache de recursos estáticos.
- **Manifesto**: Configurações de tema, ícones responsivos e exibição configuradas em `public/manifest.json`.

---

## 📁 Estrutura do Projeto

```
race-predictor/
├── .github/workflows/     # Automação de CI (GitHub Actions)
├── public/                # Arquivos estáticos, manifest.json, sw.js e ícones PWA
├── src/
│   ├── app/
│   │   ├── api/strava/    # Endpoints OAuth e busca das últimas 24 semanas
│   │   ├── api/weather/   # Proxy e geocoding Open-Meteo
│   │   ├── layout.tsx     # Metadados e viewport PWA
│   │   └── page.tsx       # Página principal da aplicação
│   ├── components/        # Componentes React (predição, clima, altimetria, mapa)
│   └── lib/               # Motores matemáticos (Minetti, Haversine, Daniels VDOT, Riegel)
├── .env.example           # Template de variáveis de ambiente
├── .gitattributes         # Normalização de finais de linha (LF)
├── .gitignore             # Arquivos ignorados pelo Git
└── README.md              # Documentação oficial
```

---

## 📄 Licença

Este projeto é distribuído sob a licença [MIT](LICENSE).
