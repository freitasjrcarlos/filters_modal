module Filterable
  extend ActiveSupport::Concern

  class_methods do
    def apply_filters(filter_params)
      return all if filter_params.blank?

      result = all
      
      if filter_params[:groups].present?
        group_conditions = []
        
        filter_params[:groups].each do |group_id, group|
          group_hash = group.to_unsafe_h
          next if group_hash[:filters].blank?
          
          group_conditions << build_group_condition(group_hash)
        end
        
        if group_conditions.any?
          operator = filter_params[:group_operator] || 'AND'
          result = result.where(group_conditions.join(" #{operator} "))
        end
      end
      
      result
    end

    private

    def build_group_condition(group)
      filter_conditions = []
      
      group[:filters].each do |filter_id, filter|
        filter_hash = filter.is_a?(ActionController::Parameters) ? filter.to_unsafe_h : filter
        next if filter_hash[:field].blank? || filter_hash[:value].blank?
        
        condition = build_filter_condition(filter_hash)
        filter_conditions << condition if condition.present?
      end
      
      operator = group[:filter_operator] || 'AND'
      "(#{filter_conditions.join(" #{operator} ")})"
    end

    def build_filter_condition(filter)
      field = filter[:field]
      value = filter[:value]
      operator = filter[:operator] || 'equals'
      
      case operator
      when 'equals'
        case field
        when 'title', 'description'
          sanitized_value = ActiveRecord::Base.connection.quote("%#{value}%")
          "#{field} LIKE #{sanitized_value}"
        else
          sanitized_value = ActiveRecord::Base.connection.quote(value)
          "#{field} = #{sanitized_value}"
        end
      when 'not_equals'
        case field
        when 'title', 'description'
          sanitized_value = ActiveRecord::Base.connection.quote("%#{value}%")
          "#{field} NOT LIKE #{sanitized_value}"
        else
          sanitized_value = ActiveRecord::Base.connection.quote(value)
          "#{field} != #{sanitized_value}"
        end
      else
        sanitized_value = ActiveRecord::Base.connection.quote(value)
        "#{field} = #{sanitized_value}"
      end
    end
  end
end
