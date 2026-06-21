/** Instruções DNS para configurar domínio custom (POC). */
export function customDomainSetupHint(domain: string): string {
  return `Configure um CNAME de ${domain} apontando para o host Netlify da clínica. Após propagar, marque como verificado no painel (POC simula verificação manual).`;
}
