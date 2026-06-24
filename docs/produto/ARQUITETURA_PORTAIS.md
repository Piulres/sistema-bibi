# Arquitetura de Portais — Sistema Bibi - ServiceOS

Mapa hierárquico canônico da plataforma. Implementação em código: `src/lib/platform/structure.ts`.

## Portal Sistema Bibi

```
Portal Sistema Bibi
├── Portal Landing Page
│   ├── /segmentos/saude          → Página Saúde (MEDICAL)
│   ├── /segmentos/veterinaria    → Página Veterinária (VET)
│   ├── /segmentos/odontologia    → Página Odontológica (DENTAL)
│   ├── /segmentos/juridico       → Página Jurídica (LEGAL)
│   ├── /segmentos/bem-estar      → Página Bem-estar (SPA)
│   └── /segmentos/educacao       → Página Educação (EDUCATION)
├── Portal Interno — Administração do Negócio
│   └── Acesso Equipe Administrativa
│       ├── Dashboard
│       ├── Faturamento
│       ├── Agendamento
│       ├── Cadastros
│       └── CRM
├── Portal do Prestador
│   └── Acesso do Prestador
│       ├── Médico / Veterinário / Dentista / Advogado / Instrutor
│       └── Profissionais (todos os prestadores)
├── Portal Empresa — Programa de Beneficiários
│   └── Acesso Corporações, RH & Gestores
│       ├── Contratos
│       ├── Consumo
│       └── Relatórios
└── Portal Beneficiário
    └── Acesso do Cliente Final
        ├── Pacientes (saúde / odonto)
        ├── Tutores (vet)
        ├── Alunos (educação)
        └── Clientes (jurídico / bem-estar)
```

**Mapa interativo:** `/plataforma`

## Site para venda do Sistema Bibi

Página comercial separada da demonstração por segmento: `/venda`

| Seção | Âncora | Conteúdo |
|-------|--------|----------|
| Propósitos | `#propositos` | Por que a plataforma existe |
| Para quem | `#para-quem` | Público-alvo por vertical |
| Missão | `#missao` | Posicionamento e compromisso |
| Valor | `#valor` | ROI e proposta de valor |

## Compatibilidade

- `/?tenant=petcare` e `/?niche=VET` continuam funcionando (legado)
- URLs canônicas por segmento: `/segmentos/[slug]`
- Cookie `bibi_segment` persiste o tenant ao navegar entre páginas

## Rotas públicas

| Rota | Papel |
|------|-------|
| `/` | Landing padrão (Saúde / tenant resolvido) |
| `/segmentos/*` | Landing dedicada por segmento |
| `/plataforma` | Mapa hierárquico da estrutura |
| `/venda` | Site comercial (propósitos, missão, valor) |
| `/interno/login` | Portal Interno |
| `/login` | Portal Prestador |
| `/pj/login` | Portal Empresa |
| `/beneficiario/login` | Portal Beneficiário |
