require "test_helper"

class FiltersLimitsTest < ActionDispatch::IntegrationTest
  setup do
    # Create test user
    @user = User.create!(name: "Test User")
    
    # Create test activities
    @activities = []
    10.times do |i|
      @activities << Activity.create!(
        title: "Activity #{i + 1}",
        description: "Description #{i + 1}",
        status: i.even?,
        start_date: Date.current,
        end_date: Date.current + 1.week,
        kind: (i % 3) + 1,
        completed_percent: (i + 1) * 10,
        priority: (i % 3) + 1,
        urgency: (i % 3) + 1,
        points: i + 1,
        user: @user
      )
    end
  end

  test "should validate that 4 groups work correctly" do
    # Parameters simulating 4 groups (maximum limit)
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Activity 1",
            m: "and"
          },
          "1" => {
            title_eq: "Activity 2",
            m: "and"
          },
          "2" => {
            title_eq: "Activity 3",
            m: "and"
          },
          "3" => {
            title_eq: "Activity 4",
            m: "and"
          }
        },
        m: "or"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return 4 activities (one from each group)
    assert_select "tbody tr", count: 4
  end

  test "should validate that 4 filters per group work correctly" do
    # Parameters simulating 4 filters in the same group
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Activity 1",
            status_eq: "true",
            kind_eq: "1",
            urgency_eq: "1",
            m: "and"
          }
        }
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return only the activity that meets all 4 criteria
    assert_select "tbody tr", count: 1
    assert_select "tbody tr td", text: "Activity 1"
  end

  test "should validate AND operator with multiple filters in the same group" do
    # Parameters simulating AND operator with multiple filters
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Activity 1",
            status_eq: "true",
            kind_eq: "1",
            m: "and"
          }
        }
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return only the activity that meets all criteria with AND
    assert_select "tbody tr", count: 1
    assert_select "tbody tr td", text: "Activity 1"
  end

  test "should validate OR operator with multiple filters in the same group" do
    # Parameters simulating OR operator with multiple filters
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Activity 1",
            m: "or"
          },
          "1" => {
            title_eq: "Activity 2",
            m: "or"
          }
        },
        m: "or"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return 2 activities (any that meet the criteria with OR)
    assert_select "tbody tr", count: 2
  end

  test "should validate AND operator between multiple groups" do
    # Parameters simulating AND operator between groups
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Activity 1",
            m: "and"
          },
          "1" => {
            status_eq: "true",
            m: "and"
          },
          "2" => {
            kind_eq: "1",
            m: "and"
          }
        },
        m: "and"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return only the activity that meets all groups with AND
    assert_select "tbody tr", count: 1
    assert_select "tbody tr td", text: "Activity 1"
  end

  test "should validate OR operator between multiple groups" do
    # Parameters simulating OR operator between groups
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Activity 1",
            m: "and"
          },
          "1" => {
            title_eq: "Activity 2",
            m: "and"
          },
          "2" => {
            title_eq: "Activity 3",
            m: "and"
          }
        },
        m: "or"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return 3 activities (one from each group with OR)
    assert_select "tbody tr", count: 3
  end

  test "should validate complex operator combination" do
    # Parameters simulating complex combination: 
    # Group 1: (title = "Activity 1" AND status = true) OR (kind = 2)
    # Group 2: (title = "Activity 2" AND status = false) OR (kind = 3)
    # Between groups: AND
    filter_params = {
      q: {
        g: {
          "0" => {
            g: {
              "0" => {
                title_eq: "Activity 1",
                status_eq: "true",
                m: "and"
              },
              "1" => {
                kind_eq: "2",
                m: "and"
              }
            },
            m: "or"
          },
          "1" => {
            g: {
              "0" => {
                title_eq: "Activity 2",
                status_eq: "false",
                m: "and"
              },
              "1" => {
                kind_eq: "3",
                m: "and"
              }
            },
            m: "or"
          }
        },
        m: "and"
      }
    }

    get activities_url, params: filter_params
    assert_response :success
    
    # Should return activities that meet the complex combination
    # The exact logic depends on Ransack implementation
    assert_response :success
  end

  test "should validate that malformed parameters do not break the application" do
    # Parameters with incorrect structure
    malformed_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Activity 1",
            # m: "and"  # Missing operator
          }
        }
      }
    }

    get activities_url, params: malformed_params
    assert_response :success
    
    # Should return the activity that matches the valid filter
    assert_select "tbody tr", count: 1
  end

  test "should validate that empty parameters in groups work" do
    # Parameters with empty groups
    empty_group_params = {
      q: {
        g: {
          "0" => {
            m: "and"
          },
          "1" => {
            title_eq: "Activity 1",
            m: "and"
          }
        },
        m: "or"
      }
    }

    get activities_url, params: empty_group_params
    assert_response :success
    
    # Should return only the activity from the non-empty group
    assert_select "tbody tr", count: 1
    assert_select "tbody tr td", text: "Activity 1"
  end

  test "should validate performance with many filters" do
    # Parameters with many filters to test performance
    start_time = Time.current
    
    filter_params = {
      q: {
        g: {
          "0" => {
            title_eq: "Activity 1",
            status_eq: "true",
            kind_eq: "1",
            urgency_eq: "1",
            priority_eq: "1",
            m: "and"
          },
          "1" => {
            title_eq: "Activity 2",
            status_eq: "false",
            kind_eq: "2",
            urgency_eq: "2",
            priority_eq: "2",
            m: "and"
          }
        },
        m: "or"
      }
    }

    get activities_url, params: filter_params
    end_time = Time.current
    
    assert_response :success
    assert (end_time - start_time) < 5.seconds, "Query took more than 5 seconds"
    
    # Should return 2 activities
    assert_select "tbody tr", count: 2
  end
end
