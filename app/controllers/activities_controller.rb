require 'uri'

class ActivitiesController < ApplicationController
  include ActivitiesHelper
  before_action :set_activity, only: %i[ show edit update destroy ]

  # GET /activities or /activities.json
  def index
    @per_page = 15
    @page = params[:page].to_i.positive? ? params[:page].to_i : 1
    @offset = (@page - 1) * @per_page
    
    # Ransack Config
    @q = Activity.ransack(params[:q])
    @q.sorts = ['urgency asc', 'start_date asc'] if @q.sorts.empty?
    
    all_activities = @q.result.includes(:user)
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
    @users = User.all
  end

  # GET /activities/1/edit
  def edit
    @users = User.all
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
