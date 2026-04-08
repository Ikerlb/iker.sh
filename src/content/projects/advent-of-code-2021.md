---
title: advent of code 2021
name: advent-of-code-2021
date: 2021-12-01
size: 12K
tags:
  - python
  - clojure
  - advent-of-code
links:
  - label: solutions repo
    href: https://github.com/Ikerlb/AoC2021
---

if you are not familiar with [advent of code](https://adventofcode.com), it is a series of fun little programming puzzles (one is released per day and difficulty usually increases as days pass). a lot of programmers solve them and the community is so vibrant that i highly recommend checking it out.

jump to: [day 1](#day-1) · [day 2](#day-2) · [day 3](#day-3) · [day 4](#day-4) · [day 5](#day-5) · [day 6](#day-6) · [day 7](#day-7) · [day 8](#day-8) · [day 9](#day-9) · [day 10](#day-10) · [day 11](#day-11) · [day 12](#day-12)

### day 1

you can find the description [here](https://adventofcode.com/2021/day/1) and the code [here](https://github.com/Ikerlb/AoC2021/tree/master/1).

my solution uses a very simple (fixed size) sliding window technique, with the first part being a size 1 window and the second part a size 3 window.

```python
def solve(l: [int], k: int):
    s = sum(l[:k])
    res = 0
    for i in range(k, len(l)):
        ss = s - l[i - k] + l[i]
        res += s < ss
        s = ss
    return res
```

### day 2

description [here](https://adventofcode.com/2021/day/2), code [here](https://github.com/Ikerlb/AoC2021/tree/master/2).

for part one, it is a very straight forward simulation.

```clojure
(defn step-part1 [x y cmd i]
  (cond
    (= cmd "forward") [(+ x i) y]
    (= cmd "up") [x (- y i)]
    :else [x (+ y i)]))
```

part two is very similar but we also need to keep track of the aim.

```clojure
(defn step-part2 [x y aim cmd i]
  (cond
    (= cmd "forward") [(+ x i) (- y (* aim i)) aim]
    (= cmd "up") [x y (+ aim i)]
    :else [x y (- aim i)]))
```

### day 3

description [here](https://adventofcode.com/2021/day/3), code [here](https://github.com/Ikerlb/AoC2021/tree/master/3).

to solve each part, we basically need a function that can give us the number of bits turned on for a certain digit index:

```python
def count_by_index(nums, i):
    total = len(nums)
    res = ones = 0
    for n in nums:
        if (n >> i) & 1:
            ones += 1
    return ones, total - ones
```

you can get the gamma rate by simply iterating over each possible index and assigning that index to be the digit of the **most** common digit of all numbers for that index. analogously, you get epsilon rate by iterating over each possible index and assigning that index to be the digit of the **least** common digit.

```python
# md is the max index of digits
def rate(nums, f, md):
    res = 0
    for i in range(md, -1, -1):
        o, z = count_by_index(nums, i)
        if f(o, z) == o:
            res += (1 << i)
    return res
```

for the second part, you need to keep filtering by the most or least common digit for each index (depending on the measurement) and return the number that remains.

```python
# md is the max index of digits
def filter_by(nums, f, md):
    n, i = len(nums), md
    while len(nums) > 1 and i >= 0:
        o, z = count_by_index(nums, i)
        s = f(o, z)
        nums = [n for n in nums if ((n >> i) & 1) == s]
        i -= 1
    return nums.pop()
```

### day 4

description [here](https://adventofcode.com/2021/day/4), code [here](https://github.com/Ikerlb/AoC2021/tree/master/4).

ok. this was fun!

for both parts, i just simulated all boards with a class. only interesting thing is i kept track of all numbers contained in a board and added a rows and cols array, containing how many remaining numbers until a bingo in each row/col. this made it very easy to know if marking a number in a board yields a bingo.

```python
class Board:
    def __init__(self, grid):
        n, m = len(grid), len(grid[0])
        self.elems = {grid[r][c]:(r, c) for r in range(n) for c in range(m)}
        self.rows = [m for _ in range(n)]
        self.cols = [n for _ in range(m)]

    def mark(self, n):
        if n not in self.elems:
            return False

        r, c = self.elems[n]
        del self.elems[n]
        self.rows[r] -= 1
        self.cols[c] -= 1
        return self.rows[r] == 0 or self.cols[c] == 0
```

for part one, just mark each board if it contains the number. if either the row or the column is all marked that board is the solution. for part two, just remove each board as it gets a bingo until you have no more boards left. the answer is the last board you removed.

### day 5

description [here](https://adventofcode.com/2021/day/5), code [here](https://github.com/Ikerlb/AoC2021/tree/master/5).

nothing interesting for this problem. just walk from p1 to p2 and add all the points you walk to a counter. for part one, simply filter those who are diagonal. for part two, don't filter.

```python
def span(p1, p2):
    sx, sy = p1
    ex, ey = p2
    dx = delta(sx, ex)
    dy = delta(sy, ey)
    while p1 != p2:
        yield p1
        p1 = (p1[0] + dx, p1[1] + dy)
    yield p1

def count_points(segments):
    c = Counter()
    for p1, p2 in segments:
        for p in span(p1, p2):
            c[p] += 1
    return c
```

### day 6

description [here](https://adventofcode.com/2021/day/6), code [here](https://github.com/Ikerlb/AoC2021/tree/master/6).

this was very fun!

my first solution consisted on a simple simulation on a double ended queue. this solution is linear on the number of days and it handles both parts without a problem.

```python
# mutates q
def step(q):
    n, last = q[0], q.pop()
    q[-1] += n
    q.append(last)
    q.rotate(-1)
```

however, it occurred to me while working that i could simply simulate a single step of this as a matrix multiplication. and well, if you have repeated matrix multiplication, you have matrix exponentiation. and if you have matrix exponentiation you have **fast** matrix exponentiation.

the (relatively) hard part of this is modeling the matrix but if you stare at the problem long enough you'll come up with the following matrix (or this matrix transposed):

```python
[[0, 0, 0, 0, 0, 0, 1, 0, 1],
 [1, 0, 0, 0, 0, 0, 0, 0, 0],
 [0, 1, 0, 0, 0, 0, 0, 0, 0],
 [0, 0, 1, 0, 0, 0, 0, 0, 0],
 [0, 0, 0, 1, 0, 0, 0, 0, 0],
 [0, 0, 0, 0, 1, 0, 0, 0, 0],
 [0, 0, 0, 0, 0, 1, 0, 0, 0],
 [0, 0, 0, 0, 0, 0, 1, 0, 0],
 [0, 0, 0, 0, 0, 0, 0, 1, 0]]
```

so my second solution looks like this and its time complexity is logarithmic on the number of days (aka blazing fast):

```python
def prod(X, Y):
    return [[sum(a*b for a,b in zip(X_row,Y_col)) for Y_col in zip(*Y)] for X_row in X]

def _pow(m, k):
    if k == 1:
        return m
    elif k % 2 == 0:
        half = _pow(m, k >> 1)
        return prod(half, half)
    else:
        half = _pow(m, k >> 1)
        return prod(half, prod(half, m))
```

### day 7

description [here](https://adventofcode.com/2021/day/7), code [here](https://github.com/Ikerlb/AoC2021/tree/master/7).

```python
def cost(l, n, f):
    return sum(f(e, n) for e in l)
```

for the first part, the solution is the median.

```python
def median(l):
    return l[len(l) >> 1]

def part1(l):
    m = median(l)
    return cost(l, m, lambda x, y: abs(x - y))
```

for the second part, the solution is the average.

```python
def part2(l):
    avg = sum(l) / len(l)
    f = lambda x, y: gauss(abs(x - y))
    return min(cost(l, ceil(avg), f), cost(l, floor(avg), f))
```

### day 8

description [here](https://adventofcode.com/2021/day/8), code [here](https://github.com/Ikerlb/AoC2021/tree/master/8).

for the first part, simply count the number of words in the output section that have lengths 2, 3, 4 or 7.

for the second part, i couldn't think of a better solution than just try permutations until the wires make sense.

### day 9

description [here](https://adventofcode.com/2021/day/9), code [here](https://github.com/Ikerlb/AoC2021/tree/master/9).

for part one, simply count the number of cells in which all neighbors are strictly greater.

for part two, floodfill until you have previously visited or until you find a height 9.

```python
def floodfill(grid, r, c):
    if grid[r][c] is None or grid[r][c] == 9:
        return 0
    s, grid[r][c] = 1, None
    for nr, nc in neighbors(grid, r, c):
        s += floodfill(grid, nr, nc)
    return s
```

### day 10

description [here](https://adventofcode.com/2021/day/10), code [here](https://github.com/Ikerlb/AoC2021/tree/master/10).

using a stack, you can figure out exactly where the string becomes invalid, if at all.

```python
m = {"{":"}", "(":")", "[":"]", "<":">"}
def parse(l):
    s = []
    for c in l:
        if c in m:
            s.append(c)
        elif s and m[s[-1]] == c:
            s.pop()
        else:
            return s, c
    return s, None
```

if the stack is not empty at the end, it means it is incomplete and the only way to complete it would be to reverse the stack and append it to the original string.

```python
mm = {"(":1, "[":2, "{":3, "<":4}
def encode(s):
    rr = 0
    # reversed because it is a stack
    for c in reversed(s):
        rr *= 5
        rr += mm[c]
    return rr
```

### day 11

description [here](https://adventofcode.com/2021/day/11), code [here](https://github.com/Ikerlb/AoC2021/tree/master/11).

the only thing we have to be careful about in this problem is avoid counting octopuses more than once. but otherwise, just simulate the steps.

here's the step function i used, that returns the number of flashes that happened during each time period:

```python
# mutates grid
def step(grid):
    n, m = len(grid), len(grid[0])
    s = []
    for r, c in product(range(n), range(m)):
        grid[r][c] += 1
        if grid[r][c] == 10:
            s.extend(neighbors(grid, r, c))
    while s:
        r, c = s.pop()
        grid[r][c] += 1
        if grid[r][c] == 10:
            s.extend(neighbors(grid, r, c))

    flashes = 0
    for r, c in product(range(n), range(m)):
        if grid[r][c] > 9:
            grid[r][c] = 0
            flashes += 1
    return flashes
```

### day 12

description [here](https://adventofcode.com/2021/day/12), code [here](https://github.com/Ikerlb/AoC2021/tree/master/12).

as long as there are no upper-cased direct loops (ie, A - B), simple dfs works for both cases.

for part 1:

```python
def dfs1(g, node, visited):
    if node == "end":
        return 1
    res = 0
    for nn in g[node]:
        if nn.isupper() or nn not in visited:
            visited.add(nn)
            res += dfs1(g, nn, visited)
            visited.discard(nn)
    return res
```

for part 2:

```python
def dfs2(g, node, visited, used):
    if node == "end":
        return 1
    res = 0
    for nn in g[node]:
        if nn.isupper():
            res += dfs2(g, nn, visited, used)
        elif nn in visited and nn != "start" and not used:
            res += dfs2(g, nn, visited, True)
        elif nn not in visited:
            visited.add(nn)
            res += dfs2(g, nn, visited, used)
            visited.discard(nn)
    return res
```
