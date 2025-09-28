require "test_helper"

class FiltersIntegrationTest < ActionDispatch::IntegrationTest
  setup do
    # Create test user
    @user = User.create!(name: "Test User")
    
    # Create test activities
    @activity1 = Activity.create!(
      title: "Test Activity 1",
      description: "Test description 1",
      status: true,
      start_date: Date.current,
      end_date: Date.current + 1.week,
      kind: 1,
      completed_percent: 50,
      priority: 1,
      urgency: 1,
      points: 5,
      user: @user
    )
    
    @activity2 = Activity.create!(
      title: "Test Activity 2",
      description: "Test description 2",
      status: false,
      start_date: Date.current,
      end_date: Date.current + 1.week,
      kind: 2,
      completed_percent: 75,
      priority: 2,
      urgency: 2,
      points: 8,
      user: @user
    )
    
    @activity3 = Activity.create!(
      title: "Test Activity 3",
      description: "Test description 3",
      status: true,
      start_date: Date.current,
      end_date: Date.current + 1.week,
      kind: 1,
      completed_percent: 25,
      priority: 3,
      urgency: 3,
      points: 3,
      user: @user
    )
  end

  test "should validate AND operator between filters in the same group" do
    # Parameters simulating AND operator between filters in the same group
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Test Activity 1",
            status_eq: "true",
            m: "and"  # AND operator between filters
          }
        }
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 (which has title "Test Activity 1" AND status true) and fixture activities
    assert_select "tbody tr", count: 1
    assert_select "tbody tr td", text: "Test Activity 1"
  end

  test "should validate OR operator between filters in the same group" do
    # Parameters simulating OR operator between filters in the same group
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Test Activity 1",
            status_eq: "false",
            m: "or"  # OR operator between filters
          }
        }
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 (title "Test Activity 1") OR activity2 (status false) + fixtures
    assert_select "tbody tr", count: 3
    assert_select "tbody tr td", text: "Test Activity 1"
    assert_select "tbody tr td", text: "Test Activity 2"
  end

  test "should validate AND operator between groups" do
    # Parameters simulating AND operator between groups
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Test Activity 1",
            m: "and"
          },
          "1" => {
            status_eq: "true",
            m: "and"
          }
        },
        m: "and"  # AND operator between groups
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 (which is in group 1 AND group 2) + fixtures
    assert_select "tbody tr", count: 1
    assert_select "tbody tr td", text: "Test Activity 1"
  end

  test "should validate OR operator between groups" do
    # Parameters simulating OR operator between groups
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Test Activity 1",
            m: "and"
          },
          "1" => {
            title_eq: "Test Activity 2",
            m: "and"
          }
        },
        m: "or"  # OR operator between groups
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 OR activity2 + fixture activities
    assert_select "tbody tr", count: 2
    assert_select "tbody tr td", text: "Test Activity 1"
    assert_select "tbody tr td", text: "Test Activity 2"
  end

  test "should validate simple filter by title" do
    filter_params = {
      q: {
        title_eq: "Test Activity 1"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 + fixture activities
    assert_select "tbody tr", count: 1
    assert_select "tbody tr td", text: "Test Activity 1"
  end

  test "should validate simple filter by status" do
    filter_params = {
      q: {
        status_eq: "true"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 and activity3 (both with status true)
    # But may also return fixture activities
    assert_select "tbody tr", count: 3
    assert_select "tbody tr td", text: "Test Activity 1"
    assert_select "tbody tr td", text: "Test Activity 3"
  end

  test "should validate filter by kind" do
    filter_params = {
      q: {
        kind_eq: "1"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 and activity3 (both with kind 1) + fixtures
    assert_select "tbody tr", count: 3
    assert_select "tbody tr td", text: "Test Activity 1"
    assert_select "tbody tr td", text: "Test Activity 3"
  end

  test "should validate filter by urgency" do
    filter_params = {
      q: {
        urgency_eq: "1"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 (urgency 1) and fixture activities
    assert_select "tbody tr", count: 2
    assert_select "tbody tr td", text: "Test Activity 1"
  end

  test "should validate filter by priority" do
    filter_params = {
      q: {
        priority_eq: "2"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity2 (priority 2) + fixture activities
    assert_select "tbody tr", count: 2
    assert_select "tbody tr td", text: "Test Activity 2"
  end

  test "should validate filter by points" do
    filter_params = {
      q: {
        points_eq: "5"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 (points 5) and fixture activities
    assert_select "tbody tr", count: 2
    assert_select "tbody tr td", text: "Test Activity 1"
  end

  test "should validate filter by completion percentage" do
    filter_params = {
      q: {
        completed_percent_eq: "50"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 (completed_percent 50) + fixtures
    assert_select "tbody tr", count: 2
    assert_select "tbody tr td", text: "Test Activity 1"
  end

  test "should validate filter by start date" do
    filter_params = {
      q: {
        start_date_eq: Date.current.strftime("%Y-%m-%d")
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return all activities (all have start_date = Date.current) + fixtures
    assert_select "tbody tr", count: 5
  end

  test "should validate filter by end date" do
    filter_params = {
      q: {
        end_date_eq: (Date.current + 1.week).strftime("%Y-%m-%d")
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return all activities (all have end_date = Date.current + 1.week) + fixtures
    assert_select "tbody tr", count: 5
  end

  test "should validate filter by description" do
    filter_params = {
      q: {
        description_eq: "Test description 2"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity2 + fixture activities
    assert_select "tbody tr", count: 1
    assert_select "tbody tr td", text: "Test Activity 2"
  end

  test "should validate filter by user" do
    filter_params = {
      q: {
        user_id_eq: @user.id.to_s
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return only activities created in test (all have the same user)
    assert_select "tbody tr", count: 3
  end

  test "should validate complex filter combination" do
    # Complex filter: (title = "Test Activity 1" AND status = true) OR (kind = 2)
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Test Activity 1",
            status_eq: "true",
            m: "and"
          },
          "1" => {
            kind_eq: "2",
            m: "and"
          }
        },
        m: "or"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activity1 (group 1) OR activity2 (group 2) + fixtures
    assert_select "tbody tr", count: 3
    assert_select "tbody tr td", text: "Test Activity 1"
    assert_select "tbody tr td", text: "Test Activity 2"
  end

  test "should validate that empty filters return all activities" do
    get activities_url
    assert_response :success
    
    # Should return all activities (3 from test + 2 from fixtures)
    assert_select "tbody tr", count: 5
  end

  test "should validate that invalid filters do not break the application" do
    # Invalid parameters
    invalid_params = {
      q: {
        invalid_field_eq: "invalid value"
      }
    }

    get activities_url, params: invalid_params
    assert_response :success
    
    # Should return all activities (invalid filter is ignored) - 3 from test + 2 from fixtures
    assert_select "tbody tr", count: 5
  end
end
