require 'uri'

class ActivitiesController < ApplicationController
  include ActivitiesHelper
  before_action :set_activity, only: %i[ show edit update destroy ]

  # GET /activities or /activities.json
  def index
    @per_page = 15
    @page = params[:page].to_i.positive? ? params[:page].to_i : 1
    @offset = (@page - 1) * @per_page
    
    # Ransack Config - Handle parameters safely
    ransack_params = params[:q]
    
    # Convert to a clean hash structure
    if ransack_params.present?
      begin
        # Convert ActionController::Parameters to regular hash
        if ransack_params.respond_to?(:to_unsafe_h)
          clean_params = ransack_params.to_unsafe_h
        elsif ransack_params.is_a?(Hash)
          clean_params = ransack_params.deep_dup
        else
          clean_params = ransack_params
        end
        
        Rails.logger.debug "Ransack params: #{clean_params.inspect}"
        
        @q = Activity.ransack(clean_params)
        
        # Debug: Log the generated SQL query
        Rails.logger.debug "Ransack SQL: #{@q.result.to_sql}"
      rescue => e
        Rails.logger.error "Ransack parameter error: #{e.message}"
        Rails.logger.error "Original params: #{ransack_params.inspect}"
        @q = Activity.ransack({})
      end
    else
      @q = Activity.ransack({})
    end
    @q.sorts = ['urgency asc', 'start_date asc'] if @q.sorts.empty?
    
    all_activities = @q.result.includes(:user)
    @total_count = all_activities.count
    @activities = all_activities.limit(@per_page).offset(@offset)
    
    @users = User.all
    @kinds = Activity::KINDS
    @urgencies = Activity::URGENCIES
    @table_columns = activity_table_columns
    
    @total_pages = (@total_count.to_f / @per_page).ceil
    @total_pages = 1 if @total_pages == 0 && @total_count > 0
    
    if @page > @total_pages && @total_pages > 0
      @page = @total_pages
      @offset = (@page - 1) * @per_page
      @activities = all_activities.limit(@per_page).offset(@offset)
    end
    
    @has_previous = @page > 1
    @has_next = @page < @total_pages
  end

  # GET /activities/1 or /activities/1.json
  def show
  end

  # GET /activities/new
  def new
    @activity = Activity.new
    @users = User.all
  end

  # GET /activities/1/edit
  def edit
    @users = User.all
  end

  # POST /activities or /activities.json
  def create
    @activity = Activity.new(activity_params)
    @users = User.all

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
    @users = User.all
    
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
    redirect_to activities_path, notice: "Filtro removido com sucesso!"
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_activity
      @activity = Activity.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def activity_params
      params.expect(activity: [ :title, :description, :status, :start_date, :end_date, :kind, :completed_percent, :priority, :urgency, :points, :user_id ])
    end


end
