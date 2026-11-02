@content
Feature: Marketing content and links
  As a visitor
  I want promotional content, app downloads and company information to be correct
  So that I can trust the platform and get started

  Scenario: Marketing banners render between the page heading and the spot market
    Given I open the "explore" page
    Then these marketing banners are visible in the promo region:
      | title                                | subtitle       |
      | Earn interest on your assets         | Up to 25% APY  |
      | Get crypto with your card            | Instant buy    |
      | Deposits using card or wire transfer | Top up today   |

  Scenario Outline: "Download the app" resolves to <store> on a <platform> device
    Given I open the "explore" page
    Then the "Download the app" link resolves to the "<store>" listing for a "<platform>" device

    Examples:
      | platform | store       |
      | iOS      | App Store   |
      | Android  | Google Play |

  @smoke
  Scenario: About Us - Why MultiBank page renders all expected components
    Given I open the "home" page
    When I select "Company" in the top navigation
    Then the main heading is "Why MultiBank Group?"
    And the hero section text contains "For nearly two decades, MultiBank has built a reputation as one of the world’s most trusted financial institutions"
    And these key figures are displayed:
      | value       | label               |
      | $2 trillion | Annual turnover     |
      | 4,000,000+  | Customers worldwide |
      | 25+         | Offices globally    |
    And these content sections are displayed:
      | heading                             | text                                                        |
      | A tradition of global leadership    | Founded in 2005, MultiBank has grown into one of the largest |
      | Innovation with purpose             | We believe technology should simplify finance               |
      | Integrity built into every decision | Trust is earned through consistent action                   |
    And the "The strength behind MultiBank Group" section shows these highlights:
      | title                  | text                                          |
      | Regulation at our core | operates under strict global oversight         |
      | Proven track record    | remained resilient and reliable               |
      | Secure & trusted       | Institution-grade infrastructure              |
    And the "Get in touch" call to action is visible
    And every visible image on the page has loaded
