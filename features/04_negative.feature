@negative
Feature: Negative and edge cases
  The platform should fail safely: unknown routes, dead links, slow or missing
  data and hanging third parties must not break the experience.

  Scenario Outline: Unknown route "<path>" is handled with a 404
    When I request the unknown route "<path>"
    Then the response status is 404
    And the page does not expose a server error

    Examples:
      | path                               |
      | /qa-missing-page-{unique}          |
      | /qa/deeply/nested/route-{unique}   |
      | /explore/../../etc/passwd-{unique} |

  @links
  Scenario Outline: No broken links in the <area>
    Given I open the "home" page
    Then none of the links in the <area> are broken

    Examples:
      | area   |
      | header |
      | footer |

  @timeout
  Scenario: Spot market tolerates slow market data
    Given market data responses are delayed by 4 seconds
    When I open the "explore" page
    Then the page shell renders within 10 seconds
    And the spot market lists at least 5 trading pairs within the content load budget

  @timeout
  Scenario: Page degrades gracefully when market data is unavailable
    Given market data requests fail
    When I open the "explore" page
    Then the page shell renders within 10 seconds
    And the spot market shows no malformed values
    And no uncaught JavaScript errors occurred

  @timeout
  Scenario: A hanging third-party chat widget does not block the page
    Given third-party chat requests never respond
    When I open the "explore" page
    Then the page shell renders within 10 seconds
    And the spot market lists at least 5 trading pairs within the content load budget
