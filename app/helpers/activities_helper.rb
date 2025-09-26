module ActivitiesHelper
  def activity_table_columns
    [
      {
        key: :id,
        label: 'ID',
        type: :integer,
        sortable: true
      },
      {
        key: :title,
        label: 'Título',
        type: :string,
        sortable: true
      },
      {
        key: :description,
        label: 'Descrição',
        type: :text,
        sortable: false,
        truncate: 50
      },
      {
        key: :status,
        label: 'Status',
        type: :boolean,
        sortable: true,
        format: ->(value) { value ? '✅' : '❌' }
      },
      {
        key: :start_date,
        label: 'Início',
        type: :date,
        sortable: true
      },
      {
        key: :end_date,
        label: 'Término',
        type: :date,
        sortable: true
      },
      {
        key: :kind,
        label: 'Tipo',
        type: :enum,
        sortable: true,
        format: ->(value) { Activity::KINDS[value] }
      },
      {
        key: :completed_percent,
        label: '% Completo',
        type: :float,
        sortable: true,
        format: ->(value) { "#{value} %" }
      },
      {
        key: :priority,
        label: 'Prioridade',
        type: :enum,
        sortable: true,
        format: ->(value) { Activity::PRIORITIES[value] }
      },
      {
        key: :urgency,
        label: 'Urgência',
        type: :enum,
        sortable: true,
        format: ->(value) { Activity::URGENCIES[value] }
      },
      {
        key: :points,
        label: 'Pontos',
        type: :integer,
        sortable: true
      },
      {
        key: :user,
        label: 'Responsável',
        type: :association,
        sortable: false,
        format: ->(value) { value&.name || 'Sem usuário' }
      },
      {
        key: :actions,
        label: 'Ações',
        type: :actions,
        sortable: false
      }
    ]
  end

  # Renderiza o cabeçalho da tabela
  def render_table_header(columns)
    content_tag :thead, style: "background-color: #f2f2f2;" do
      content_tag :tr do
        columns.map do |column|
          content_tag :th, column[:label], style: "padding: 8px; text-align: left;"
        end.join.html_safe
      end
    end
  end

  # Renderiza uma célula da tabela
  def render_table_cell(activity, column)
    value = case column[:key]
    when :actions
      render_activity_actions(activity)
    when :user
      column[:format]&.call(activity.user)
    else
      raw_value = activity.send(column[:key])
      if column[:format]
        column[:format].call(raw_value)
      elsif column[:truncate] && raw_value.is_a?(String)
        truncate(raw_value, length: column[:truncate])
      else
        raw_value
      end
    end

    content_tag :td, value, style: "padding: 8px;"
  end

  # Renderiza as ações da atividade
  def render_activity_actions(activity)
    [
      link_to('Show', activity, style: "margin-right: 6px;"),
      link_to('Edit', edit_activity_path(activity), style: "margin-right: 6px;"),
      link_to('Delete', activity, method: :delete, data: { confirm: 'Tem certeza?' }, style: "color: red;")
    ].join.html_safe
  end

  # Retorna o nome amigável do campo para exibição
  def get_field_display_name(field)
    field_names = {
      'title' => 'Título',
      'description' => 'Descrição',
      'status' => 'Status',
      'start_date' => 'Data Início',
      'end_date' => 'Data Término',
      'kind' => 'Tipo',
      'completed_percent' => '% Completo',
      'priority' => 'Prioridade',
      'urgency' => 'Urgência',
      'points' => 'Pontos',
      'user_id' => 'Responsável'
    }
    field_names[field] || field.humanize
  end

  # Retorna o nome amigável do operador para exibição
  def get_operator_display_name(operator)
    operator_names = {
      'equals' => '=',
      'not_equals' => '≠'
    }
    operator_names[operator] || operator
  end
end