require "test_helper"

class ActivitiesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @activity = activities(:one)
  end

  test "should get index" do
    get activities_url
    assert_response :success
  end

  test "should get new" do
    get new_activity_url
    assert_response :success
  end

  test "should create activity" do
    user = User.create!(name: "Test User")
    
    assert_difference("Activity.count") do
      post activities_url, params: { activity: { completed_percent: @activity.completed_percent, description: @activity.description, end_date: @activity.end_date, points: @activity.points, priority: @activity.priority, start_date: @activity.start_date, status: @activity.status, title: @activity.title, kind: @activity.kind, urgency: @activity.urgency, user_id: user.id } }
    end

    assert_redirected_to activity_url(Activity.last)
  end

  test "should show activity" do
    get activity_url(@activity)
    assert_response :success
  end

  test "should get edit" do
    get edit_activity_url(@activity)
    assert_response :success
  end

  test "should update activity" do
    patch activity_url(@activity), params: { activity: { completed_percent: @activity.completed_percent, description: @activity.description, end_date: @activity.end_date, points: @activity.points, priority: @activity.priority, start_date: @activity.start_date, status: @activity.status, title: @activity.title, kind: @activity.kind, urgency: @activity.urgency } }
    assert_redirected_to activity_url(@activity)
  end

  test "should destroy activity" do
    assert_difference("Activity.count", -1) do
      delete activity_url(@activity)
    end

    assert_redirected_to activities_url
  end

  test "should handle complex ransack parameters without with_indifferent_access error" do
    # Test the new correct structure (single group with two filters)
    complex_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Atividade 53",
            status_eq: "true",
            m: "and"
          }
        }
      }
    }

    # This should not raise a NoMethodError
    assert_nothing_raised do
      get activities_url, params: complex_params
    end

    assert_response :success
  end

  test "should apply filters correctly" do
    user = User.create!(name: "Test User")
    
    # Create test activities
    activity1 = Activity.create!(
      title: "Atividade 53",
      description: "Test description",
      status: true,
      start_date: Date.current,
      end_date: Date.current + 1.week,
      kind: 1,
      completed_percent: 50,
      priority: 1,
      urgency: 1,
      points: 5,
      user: user
    )
    
    activity2 = Activity.create!(
      title: "Atividade 59",
      description: "Test description",
      status: false,
      start_date: Date.current,
      end_date: Date.current + 1.week,
      kind: 1,
      completed_percent: 50,
      priority: 1,
      urgency: 1,
      points: 5,
      user: user
    )

    # Test filter parameters with correct structure
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Atividade 53",
            status_eq: "true",
            m: "and"
          }
        }
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should only return activity1 (matches both title and status)
    assert_select "tbody tr", count: 1
    assert_select "tbody tr td", text: "Atividade 53"
  end

  test "should handle multiple group ransack parameters without with_indifferent_access error" do
    # Test multiple groups with correct structure
    multi_group_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Atividade 53",
            status_eq: "true",
            m: "and"
          },
          "1" => {
            title_eq: "Atividade 59",
            status_eq: "true", 
            m: "and"
          }
        },
        m: "or"
      }
    }

    # This should not raise a NoMethodError
    assert_nothing_raised do
      get activities_url, params: multi_group_params
    end

    assert_response :success
  end
end
