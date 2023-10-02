@ff
Feature: Test Feature

  Scenario: Scenario #4
    Given a step passes
    When a step passes
    Then a step passes

  @scenarioOutline
  Scenario Outline: Scenario Outline #4 (Example - param1: <param1>, param2: <param2>)
    Given a step passes
    When a step passes
    Then a step passes

    Examples: 
      | param1 | param2 |
      |    a   |    b   |
