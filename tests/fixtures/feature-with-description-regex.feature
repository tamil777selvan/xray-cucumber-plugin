Feature: Test Feature

  Scenario: TC_01 Scenario #2
    Given a step passes
    When a step passes
    Then a step passes

  Scenario Outline: TC_01 Scenario Outline #2 (Example - param1: <param1>, param2: <param2>)
    Given a step passes
    When a step passes
    Then a step passes

    Examples: 
      | param1 | param2 |
      |    a   |    b   |
