# Sistema de Filtros Modal - Artia

Este projeto implementa um sistema completo de filtros modais para listagens de dados

## 🚀 Executar o projeto

```bash
make docker
```

## 📋 Funcionalidades Implementadas

### ✅ Requisitos Atendidos

- **Modal de Filtros**: Modal responsivo acessível via botão "Filtrar"
- **Filtros por Coluna**: Cada coluna da tabela é uma opção de filtro
- **Múltiplos Grupos**: Até 4 grupos de filtros, cada um com até 4 filtros
- **Operadores E/OU**: Entre grupos e entre filtros agrupados
- **Campos com Nomes**: Usuários, tipos e urgências listam nomes amigáveis
- **Validação**: Limites e validação de campos obrigatórios

## 🏗️ Arquitetura da Solução

### Frontend (JavaScript/Stimulus)
- **Controller**: `filters_modal_controller.js`
- **Estilos**: `filters_modal.css`
- **Interface**: Modal responsivo com animações

### Backend (Rails)
- **Controller**: `activities_controller.rb` com integração Ransack
- **Modelo**: `activity.rb` com configuração de campos filtráveis
- **Helper**: `activities_helper.rb` com lógica de campos dinâmicos

### Dependências Principais
- **Ransack**: Para construção de queries complexas
- **Stimulus**: Para interatividade JavaScript
- **Kaminari**: Para paginação

## 🎯 Como Funciona

### 1. Estrutura de Grupos
```
Grupo 1: (filtro1 E filtro2) OU Grupo 2: (filtro3 E filtro4)
```

### 2. Parâmetros Ransack Gerados
```ruby
# Estrutura de grupos
q[g][0][title_eq] = "valor"     # Grupo 1, filtro por título
q[g][0][status_eq] = "true"     # Grupo 1, filtro por status
q[g][0][m] = "and"              # Operador entre filtros do grupo 1
q[g][1][kind_eq] = "1"          # Grupo 2, filtro por tipo
q[g][1][m] = "and"              # Operador entre filtros do grupo 2
q[m] = "or"                     # Operador entre grupos
```

### 3. Tipos de Campo Suportados
- **text**: Input de texto livre
- **number**: Input numérico
- **date**: Input de data
- **select**: Dropdown com opções predefinidas
- **boolean**: Select Ativo/Inativo

## 📝 Exemplos de Filtros

### Exemplo 1: Filtro Simples
**Objetivo**: Buscar atividades com título "Bug fix"
```
Campo: Título
Operador: Igual
Valor: "Bug fix"
```

**Resultado**: Atividades que contenham exatamente "Bug fix" no título.

### Exemplo 2: Filtro por Status e Tipo
**Objetivo**: Atividades ativas do tipo "Melhoria"
```
Campo: Status
Operador: Igual
Valor: "Ativo"

E

Campo: Tipo
Operador: Igual
Valor: "Melhoria"
```

**Resultado**: Atividades que estejam ativas E sejam do tipo Melhoria.

### Exemplo 3: Filtro por Usuário e Urgência
**Objetivo**: Atividades do usuário "João" com urgência alta
```
Campo: Responsável
Operador: Igual
Valor: "João Silva"

E

Campo: Urgência
Operador: Igual
Valor: "Alto"
```

**Resultado**: Atividades atribuídas ao João Silva E com urgência alta.

### Exemplo 4: Filtro por Data
**Objetivo**: Atividades que começam em uma data específica
```
Campo: Data Início
Operador: Igual
Valor: "2024-01-15"
```

**Resultado**: Atividades que começam exatamente em 15/01/2024.

### Exemplo 5: Filtro por Percentual de Conclusão
**Objetivo**: Atividades com mais de 50% concluídas
```
Campo: % Completo
Operador: Maior que
Valor: "50"
```

**Resultado**: Atividades com percentual de conclusão maior que 50%.

### Exemplo 6: Grupos com Operador OU
**Objetivo**: Atividades do tipo "Bug" OU com urgência "Alta"
```
Grupo 1:
  Campo: Tipo
  Operador: Igual
  Valor: "Bug"

OU

Grupo 2:
  Campo: Urgência
  Operador: Igual
  Valor: "Alto"
```

**Resultado**: Atividades que sejam do tipo Bug OU tenham urgência alta.

### Exemplo 7: Filtro Complexo com Múltiplos Grupos
**Objetivo**: (Atividades do usuário "Maria" E status ativo) OU (Tipo "Documentação" E urgência "Baixa")
```
Grupo 1:
  Campo: Responsável = "Maria Santos"
  E
  Campo: Status = "Ativo"

OU

Grupo 2:
  Campo: Tipo = "Documentação"
  E
  Campo: Urgência = "Baixa"
```

**Resultado**: Atividades que atendam ao Grupo 1 OU ao Grupo 2.

### Exemplo 8: Filtro por Pontos
**Objetivo**: Atividades com 5 ou mais pontos
```
Campo: Pontos
Operador: Maior ou igual
Valor: "5"
```

**Resultado**: Atividades com 5 ou mais pontos de estimativa.

## 🔧 Configuração de Campos Filtráveis

### Adicionando Novos Campos
Para adicionar novos campos filtráveis, edite o helper `activities_helper.rb`:

```ruby
def field_type(field)
  case field
  when 'novo_campo'
    'select'  # ou 'text', 'number', 'date', 'boolean'
  # ... outros campos
  end
end

def field_label(field)
  labels = {
    'novo_campo' => 'Novo Campo',
    # ... outros labels
  }
end
```

### Configurando Opções de Select
Para campos do tipo select, adicione as opções no controller JavaScript:

```javascript
// No filters_modal_controller.js
this.novo_campo_options = {
  1: "Opção 1",
  2: "Opção 2",
  3: "Opção 3"
};
```

## 🎨 Interface do Usuário

### Elementos Visuais
- **Modal responsivo** com overlay
- **Grupos visuais** com ícones e numeração
- **Operadores E/OU** claramente identificados
- **Validação em tempo real** com feedback visual
- **Botões de ação** intuitivos

### Estados da Interface
- **Campos válidos**: Borda verde
- **Campos inválidos**: Borda vermelha com animação
- **Limites atingidos**: Botões desabilitados
- **Mensagens de erro**: Contextuais e informativas

## 🧪 Testes

### Testes de Integração
- Validação de operadores E/OU
- Filtros simples e complexos
- Parâmetros Ransack
- Casos edge

### Testes de Sistema
- Elementos da interface
- Funcionalidades do modal
- Responsividade

### Executar Testes
```bash
# Todos os testes
rails test

# Testes específicos
rails test test/integration/filters_integration_test.rb
rails test test/system/filters_modal_test.rb
```

## 🔄 Reutilização

A solução foi arquitetada para ser reutilizável em outras listagens:

1. **Controller Stimulus genérico** - pode ser usado em qualquer listagem
2. **Helper modular** - `filterable_fields` pode ser customizado
3. **CSS componentizado** - estilos podem ser reutilizados
4. **Estrutura Ransack padrão** - compatível com qualquer modelo
