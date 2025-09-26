require 'uri'

class ActivitiesController < ApplicationController
  include ActivitiesHelper
  before_action :set_activity, only: %i[ show edit update destroy ]

  # GET /activities or /activities.json
  def index
    @per_page = 15
    @page = params[:page].to_i.positive? ? params[:page].to_i : 1
    @offset = (@page - 1) * @per_page
    
    all_activities = Activity.apply_filters(filter_params).order(:urgency, :start_date)
    @total_count = all_activities.count
    @activities = all_activities.limit(@per_page).offset(@offset)
    
    @users = User.all
    @kinds = Activity::KINDS
    @urgencies = Activity::URGENCIES
    @table_columns = activity_table_columns
    
    @total_pages = (@total_count.to_f / @per_page).ceil
    @has_previous = @page > 1
    @has_next = @page < @total_pages
  end

  # GET /activities/1 or /activities/1.json
  def show
  end

  # GET /activities/new
  def new
    @activity = Activity.new
  end

  # GET /activities/1/edit
  def edit
  end

  # POST /activities or /activities.json
  def create
    @activity = Activity.new(activity_params)

    respond_to do |format|
      if @activity.save
        format.html { redirect_to @activity, notice: "Activity was successfully created." }
        format.json { render :show, status: :created, location: @activity }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @activity.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /activities/1 or /activities/1.json
  def update
    respond_to do |format|
      if @activity.update(activity_params)
        format.html { redirect_to @activity, notice: "Activity was successfully updated." }
        format.json { render :show, status: :ok, location: @activity }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @activity.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /activities/1 or /activities/1.json
  def destroy
    @activity.destroy!

    respond_to do |format|
      format.html { redirect_to activities_path, status: :see_other, notice: "Activity was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  # DELETE /remove_filter or /remove_filter.json
  def remove_filter
    group_id = params[:group_id]
    filter_id = params[:filter_id]

    referer_url = request.referer
    
    if referer_url.blank?
      redirect_to activities_path, alert: "Erro: URL de referência não encontrada"
      return
    end

    referer_uri = URI.parse(referer_url)
    current_params = Rack::Utils.parse_query(referer_uri.query).with_indifferent_access
    
    new_params = current_params.deep_dup
    
    filter_removed = false
    
    new_params.each do |key, value|
      if key.start_with?("groups[#{group_id}][filters]") && key.include?("[#{filter_id}]")
        Rails.logger.info "Filtro encontrado! Removendo: #{key}"
        new_params.delete(key)
        filter_removed = true
      end
    end
    
    if filter_removed
      group_has_filters = new_params.keys.any? { |key| key.start_with?("groups[#{group_id}][filters]") }
      
      if !group_has_filters
        new_params.delete("groups[#{group_id}][filter_operator]")
      end
      
      has_any_groups = new_params.keys.any? { |key| key.start_with?("groups[") }
      
      if !has_any_groups
        new_params.delete("group_operator")
      end
    else
      Rails.logger.warn "Filtro não encontrado! group_id: #{group_id}, filter_id: #{filter_id}"
    end
    
    respond_to do |format|
      format.html { redirect_to activities_path(new_params), notice: "Filtro removido com sucesso!" }
      format.json { render json: { status: 'success', message: 'Filtro removido com sucesso!', redirect_url: activities_path(new_params) } }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_activity
      @activity = Activity.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def activity_params
      params.expect(activity: [ :title, :description, :status, :start_date, :end_date, :kind, :completed_percent, :priority, :urgency, :points ])
    end

    def filter_params
      params.permit(
        :group_operator,
        groups: {}
      ).tap do |permitted|
        if permitted[:groups].present?
          permitted[:groups].each do |group_id, group_params|
            group_params.permit(:filter_operator, filters: {})
            if group_params[:filters].present?
              group_params[:filters].each do |filter_id, filter_params|
                filter_params.permit(:field, :operator, :value)
              end
            end
          end
        end
      end
    end
end
