@navigation
Feature: Top navigation and layout
  As a visitor of Multibank Group
  I want a consistent top navigation
  So that I can reach every key area of the platform

  Background:
    Given I open the "home" page

  @smoke
  Scenario: Top navigation renders all expected items
    Then the top navigation displays these items in order:
      | Explore  |
      | Features |
      | OTC Desk |
      | Company  |
      | Support  |
      | Blog     |
      | $MBG     |
    And the header shows the "Sign in" and "Sign up" actions
    And the header logo links to the homepage
  
  @smoke
  Scenario Outline: "<item>" opens the correct page
    When I select "<item>" in the top navigation
    Then I land on the destination configured for "<item>"
    Examples:
      | item     |
      | Explore  |
      | Features |
      | OTC Desk |
      | Company  |
      | Support  |
      | Blog     |
      
  @smoke
  Scenario Outline: "<item>" points to the correct external destination
    Then the header link "<item>" points to its configured destination
    And the destination of header link "<item>" responds successfully
    Examples:
      | item    |
      | $MBG    |
      | Sign in |
      | Sign up |

  Scenario Outline: Navigation layout holds at <width>x<height> desktop viewport
    Given the browser viewport is <width>x<height>
    When I reload the page
    Then the desktop navigation is fully visible on a single row
    And the mobile menu button is hidden
    And the page has no horizontal overflow
    Examples:
      | width | height |
      | 1280  | 720    |
      | 1366  | 768    |
      | 1440  | 900    |
      | 1920  | 1080   |
