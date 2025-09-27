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
      'eq' => '=',
      'not_eq' => '≠',
      'cont' => 'contém',
      'not_cont' => 'não contém',
      'gt' => '>',
      'gteq' => '>=',
      'lt' => '<',
      'lteq' => '<=',
      'in' => 'em',
      'not_in' => 'não em'
    }
    operator_names[operator] || operator
  end

  # Gera URL para remover um filtro específico
  def remove_filter_url(group_index, filter_index)
    q_params = params[:q]
    if q_params.is_a?(String)
      q_params = {}
    elsif q_params.respond_to?(:to_unsafe_h)
      q_params = q_params.to_unsafe_h
    end
    current_params = q_params || {}
    
    # Handle nested structure (q[g][0][g][0], q[g][0][g][1])
    if group_index.to_s.include?('_')
      # Format: "0_0" or "0_1" for nested groups
      main_group, nested_group = group_index.to_s.split('_')
      
      if current_params[:g] && current_params[:g][main_group] && current_params[:g][main_group][:g] && current_params[:g][main_group][:g][nested_group]
        new_params = current_params.deep_dup
        new_params[:g][main_group][:g][nested_group][:c].delete(filter_index)
        
        # If no more filters in this nested group, remove the nested group
        if new_params[:g][main_group][:g][nested_group][:c].empty?
          new_params[:g][main_group][:g].delete(nested_group)
        end
        
        # If no more nested groups, remove the main group
        if new_params[:g][main_group][:g].empty?
          new_params[:g].delete(main_group)
        end
        
        # If no more groups, remove the g key
        if new_params[:g].empty?
          new_params.delete(:g)
        end
        
        activities_path(q: new_params)
      else
        activities_path
      end
    else
      if current_params[:g] && current_params[:g][group_index]
        new_params = current_params.deep_dup
        new_params[:g][group_index][:c].delete(filter_index)
        
        if new_params[:g][group_index][:c].empty?
          new_params[:g].delete(group_index)
        end
        
        if new_params[:g].empty?
          new_params.delete(:g)
        end
        
        activities_path(q: new_params)
      else
        activities_path
      end
    end
  end
end