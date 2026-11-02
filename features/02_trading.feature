@trading
Feature: Spot market
  As a prospective trader
  I want to browse spot trading pairs by category
  So that I can find assets worth trading

  Background:
    Given I open the "explore" page

  @smoke
  Scenario: Spot trading section renders and lists trading pairs
    Then the spot market section is visible
    And the spot market lists at least 5 trading pairs

  Scenario Outline: Pairs listed under "<category>" belong to that category
    When I select the "<category>" spot market category
    Then the spot market lists at least 5 trading pairs
    And every listed pair belongs to the "<category>" category in the market data feed

    Examples:
      | category |
      | Hot      |
      | Gainers  |
      | Losers   |

  Scenario: Switching category regroups the listed pairs
    When I select the "Gainers" spot market category
    And I remember the listed pairs as "gainers"
    And I select the "Losers" spot market category
    And I remember the listed pairs as "losers"
    Then the pair lists "gainers" and "losers" are different

  Scenario: Each trading pair entry contains the expected data fields
    Then every listed trading pair satisfies these field rules:
      | field  | rule                  |
      | symbol | uppercase ticker      |
      | name   | non-empty text        |
      | icon   | image with symbol alt |
      | price  | USD price             |
      | change | percentage            |
      | chart  | 7-day sparkline       |
      | link   | asset details link    |
    And the spot market shows no malformed values

  Scenario: Selecting a trading pair opens its asset page
    When I open the first listed trading pair
    Then I am on the asset page of that trading pair
