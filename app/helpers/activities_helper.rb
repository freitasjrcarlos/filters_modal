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

  def render_table_header(columns)
    content_tag :thead, style: "background-color: #f2f2f2;" do
      content_tag :tr do
        columns.map do |column|
          content_tag :th, column[:label], style: "padding: 8px; text-align: left;"
        end.join.html_safe
      end
    end
  end

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

  def render_activity_actions(activity)
    [
      link_to('Show', activity, style: "margin-right: 6px;"),
      link_to('Edit', edit_activity_path(activity), style: "margin-right: 6px;"),
      link_to('Delete', activity, method: :delete, data: { confirm: 'Tem certeza?' }, style: "color: red;")
    ].join.html_safe
  end

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

  def build_nested_query_string(params)
    return "" if params.empty?
    
    if params.keys == ['g'] && params['g'].is_a?(Hash)
      query_parts = []
      params['g'].each do |group_index, group_data|
        group_data.each do |key, value|
          query_parts << "q[g][#{group_index}][#{key}]=#{CGI.escape(value.to_s)}"
        end
      end
      query_parts.join('&')
    elsif params.keys.include?('g') && params.keys.include?('m')
      query_parts = []
      params['g'].each do |group_index, group_data|
        group_data.each do |key, value|
          query_parts << "q[g][#{group_index}][#{key}]=#{CGI.escape(value.to_s)}"
        end
      end
      query_parts << "q[m]=#{CGI.escape(params['m'].to_s)}"
      query_parts.join('&')
    else
      params.to_query
    end
  end

  def filterable_fields
    Activity.ransackable_attributes.map do |field|
      {
        value: field,
        label: field_label(field),
        type: field_type(field)
      }
    end
  end

  def field_label(field)
    labels = {
      'title' => 'Título',
      'description' => 'Descrição',
      'status' => 'Status',
      'kind' => 'Tipo',
      'urgency' => 'Urgência',
      'priority' => 'Prioridade',
      'user_id' => 'Usuário',
      'start_date' => 'Data Início',
      'end_date' => 'Data Término',
      'completed_percent' => '% Completo',
      'points' => 'Pontos',
      'created_at' => 'Data Criação',
      'updated_at' => 'Data Atualização'
    }
    labels[field] || field.humanize
  end

  def field_type(field)
    case field
    when 'kind', 'urgency', 'priority', 'user_id'
      'select'
    when 'status'
      'boolean'
    when 'start_date', 'end_date', 'created_at', 'updated_at'
      'date'
    when 'completed_percent', 'points'
      'number'
    else
      'text'
    end
  end

  def remove_grouping_filter_url(grouping_index, field_operator, clear_path = nil)
    q_params = params[:q]
    if q_params.is_a?(String)
      q_params = {}
    elsif q_params.respond_to?(:to_unsafe_h)
      q_params = q_params.to_unsafe_h
    end
    current_params = q_params || {}
    
    if current_params[:groupings] && current_params[:groupings][grouping_index]
      new_params = current_params.deep_dup
      new_params[:groupings][grouping_index].delete(field_operator)
      
      if new_params[:groupings][grouping_index].empty?
        new_params[:groupings].delete(grouping_index)
      end
      
      if new_params[:groupings].empty?
        new_params.delete(:groupings)
      end
      
      base_path = clear_path || activities_path
      query_string = build_nested_query_string(new_params)
      query_string.present? ? "#{base_path}?#{query_string}" : base_path
    else
      clear_path || activities_path
    end
  end

  def remove_filter_url(group_index, filter_index, clear_path = nil)
    q_params = params[:q]
    if q_params.is_a?(String)
      q_params = {}
    elsif q_params.respond_to?(:to_unsafe_h)
      q_params = q_params.to_unsafe_h
    end
    current_params = q_params || {}
    
    if group_index.to_s.include?('_')
      main_group, nested_group = group_index.to_s.split('_')
      
      if current_params[:g] && current_params[:g][main_group] && current_params[:g][main_group][:g] && current_params[:g][main_group][:g][nested_group]
        new_params = current_params.deep_dup
        new_params[:g][main_group][:g][nested_group][:c].delete(filter_index)
        
        if new_params[:g][main_group][:g][nested_group][:c].empty?
          new_params[:g][main_group][:g].delete(nested_group)
        end
        
        if new_params[:g][main_group][:g].empty?
          new_params[:g].delete(main_group)
        end
        
        if new_params[:g].empty?
          new_params.delete(:g)
        end
        
        base_path = clear_path || activities_path
        query_string = build_nested_query_string(new_params)
        query_string.present? ? "#{base_path}?#{query_string}" : base_path
      else
        clear_path || activities_path
      end
    else
      if current_params[:g] && current_params[:g][group_index]
        new_params = current_params.deep_dup
        
        if new_params[:g][group_index][:c]
          new_params[:g][group_index][:c].delete(filter_index)
          
          if new_params[:g][group_index][:c].empty?
            new_params[:g].delete(group_index)
          end
        else
          new_params[:g][group_index].delete(filter_index)
          
          if new_params[:g][group_index].keys == ['m'] || new_params[:g][group_index].empty?
            new_params[:g].delete(group_index)
          end
        end
        
        if new_params[:g].empty?
          new_params.delete(:g)
        end
        
        base_path = clear_path || activities_path
        query_string = build_nested_query_string(new_params)
        query_string.present? ? "#{base_path}?#{query_string}" : base_path
      else
        clear_path || activities_path
      end
    end
  end
end