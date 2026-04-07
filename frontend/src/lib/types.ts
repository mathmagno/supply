// ── Entidades do domínio ──────────────────────────────────────────────────

export interface Categoria {
  id: number;
  nome: string;
  criado_em: string;
}

export interface Especificacao {
  id: number;
  categoria_id: number;
  codigo: string;
  marca: string | null;
  descricao: string;
  unidade: string;
  custo_planejado: string | null;
  ultimo_custo: string | null;
  criado_em: string;
  atualizado_em: string;
  categoria: Categoria;
}

export interface Fornecedor {
  id: number;
  nome: string;
  segmento: string | null;
  contato: string | null;
  whatsapp: string | null;
  lead_time_dias: number | null;
  lead_time_calculado: number | null;
  ativo: number;
  criado_em: string;
}

export interface SessaoCotacao {
  id: number;
  data_cotacao: string;
  descricao: string | null;
  arquivo_origem: string | null;
  criado_em: string;
  total_produtos: number;
  total_fornecedores: number;
  tem_pedidos: boolean;
  status_kanban: string | null;
}

export interface PrecoFornecedor {
  fornecedor_id: number;
  fornecedor_nome: string;
  preco: string;
  posicao_planilha: number | null;
  menor_preco: boolean;
  lead_time_medio: number | null;
  taxa_pontualidade: number | null;
  total_pedidos_recebidos: number;
}

export interface CotacaoComparativa {
  especificacao: Especificacao;
  sessao_id: number;
  data_cotacao: string;
  precos: PrecoFornecedor[];
}

export type StatusPedido =
  | "cotando"
  | "aprovado"
  | "pedido_emitido"
  | "em_transito"
  | "recebido";

export interface PedidoKanban {
  id: number;
  especificacao_id: number;
  especificacao_codigo: string;
  especificacao_descricao: string;
  fornecedor_nome: string;
  status: StatusPedido;
  quantidade: string;
  preco_cotado: string;
  prazo_fornecedor: string | null;
  prazo_vencido: boolean;
  prazo_proximo: boolean;
  criado_em: string;
  data_pedido: string | null;
  data_recebimento: string | null;
}

export interface SlaFornecedor {
  fornecedor: string;
  tempo_resposta_medio: number | null;
  tempo_entrega_medio: number | null;
  total_com_emissao: number;
  total_recebidos: number;
}

export interface Pedido {
  id: number;
  especificacao: Especificacao;
  fornecedor: Fornecedor;
  cotacao_id: number | null;
  status: StatusPedido;
  quantidade: string;
  preco_cotado: string;
  custo_planejado: string | null;
  custo_comprado: string | null;
  saving: string | null;
  prazo_fornecedor: string | null;
  data_pedido: string | null;
  data_recebimento: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ResumoDashboard {
  total_pedidos: number;
  pedidos_em_aberto: number;
  saving_acumulado: number;
}

export interface SavingGeral {
  saving_total: number;
  gasto_total: number;
  total_pedidos_recebidos: number;
  por_fornecedor: { fornecedor: string; saving: number }[];
  por_especificacao: { codigo: string; saving: number }[];
}

export interface HistoricoPrecos {
  especificacao_id: number;
  series: { fornecedor: string; dados: { data: string; preco: number }[] }[];
}
