@api
Feature: Public market data API
  The public endpoints that feed the Explore page are validated directly, and
  used as an oracle for the UI checks in the trading feature.

  Scenario Outline: "<endpoint>" endpoint returns valid JSON matching its schema
    When I call the "<endpoint>" market API
    Then the API responds with status 200 and a JSON list
    And every record matches the "<endpoint>" response schema
    And the API responds within the latency budget

    Examples:
      | endpoint    |
      | instruments |
      | widget      |
      | prices      |

  Scenario: Instruments include the core assets
    When I call the "instruments" market API
    Then the instruments include these assets:
      | BTC |
      | ETH |
      | SOL |

  Scenario: Market widget groups assets into the spot categories
    When I call the "widget" market API
    Then the market widget contains the categories:
      | hot     |
      | gainers |
      | losers  |
    And every category only references known instruments