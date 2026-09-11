# Interval Timer

## Timer Hierarchy:
### 1. Sets:
A set is a collection of rounds. After all rounds in a set are completed, there can be a rest period (optional) before moving to the next set. If all sets are completed, the workout ends.

Each set has:

- A defined number of rounds.
- A collection of intervals that define the structure of each round.
- An optional setting to skip the final interval of its final round. When enabled, the timer proceeds to the normal next step, such as rest between sets or the next set.

### 2. Rounds:
A round is a collection of intervals. Each round is a repeat of the intervals in the order they were defined. After completing all intervals in a round, the next round starts. After all rounds (as defined in the set) are completed, the set ends and either moves to the next set or initiates a rest period (if defined).

### 3. Intervals:
An interval is the smallest unit in this hierarchy. It has:

- A name (e.g., "Work", "Rest", "High Intensity", "Low Intensity").
- A duration (e.g., 30 seconds, 1 minute).
- A color (optional) for visual indication on the canvas.

### Illustrative Example:

Let's take a simple configuration to help visualize the hierarchy:

- 2 Sets
    - Set 1:
        - 3 Rounds
        - Intervals:
            1. "Work" for 20 seconds
            2. "Rest" for 10 seconds
    - Set 2:
        - 2 Rounds
        - Intervals:
            1. "High Intensity" for 30 seconds
            2. "Low Intensity" for 15 seconds
            3. "Rest" for 15 seconds

The flow would be:

1. Start Set 1
2. Round 1:
    - "Work" for 20 seconds
    - "Rest" for 10 seconds
3. Round 2:
    - "Work" for 20 seconds
    - "Rest" for 10 seconds
4. Round 3:
    - "Work" for 20 seconds
    - "Rest" for 10 seconds
5. End Set 1
6. (Optional rest period between sets)
7. Start Set 2
8. Round 1:
    - "High Intensity" for 30 seconds
    - "Low Intensity" for 15 seconds
    - "Rest" for 15 seconds
9. Round 2:
    - "High Intensity" for 30 seconds
    - "Low Intensity" for 15 seconds
    - "Rest" for 15 seconds
10. End Set 2
11. Workout ends

This hierarchy allows for highly customizable workouts where users can define multiple sets, each with a different number of rounds and interval structures.
