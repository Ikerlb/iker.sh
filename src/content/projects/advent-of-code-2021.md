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

twelve days, twelve write-ups. click any to expand.

<details class="day">
<summary>day 1 — sliding window (python)</summary>

description [here](https://adventofcode.com/2021/day/1), code [here](https://github.com/Ikerlb/AoC2021/tree/master/1).

a very simple fixed-size sliding window. part one uses a window of 1, part two a window of 3.

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

</details>

<details class="day">
<summary>day 2 — submarine simulation (clojure)</summary>

description [here](https://adventofcode.com/2021/day/2), code [here](https://github.com/Ikerlb/AoC2021/tree/master/2).

part one is a straightforward simulation:

```clojure
(defn step-part1 [x y cmd i]
  (cond
    (= cmd "forward") [(+ x i) y]
    (= cmd "up") [x (- y i)]
    :else [x (+ y i)]))
```

part two is similar but we also need to keep track of the aim.

```clojure
(defn step-part2 [x y aim cmd i]
  (cond
    (= cmd "forward") [(+ x i) (- y (* aim i)) aim]
    (= cmd "up") [x y (+ aim i)]
    :else [x y (- aim i)]))
```

</details>

<details class="day">
<summary>day 3 — bit counting (python)</summary>

description [here](https://adventofcode.com/2021/day/3), code [here](https://github.com/Ikerlb/AoC2021/tree/master/3).

both parts boil down to a function that counts how many numbers have a given bit set:

```python
def count_by_index(nums, i):
    total = len(nums)
    res = ones = 0
    for n in nums:
        if (n >> i) & 1:
            ones += 1
    return ones, total - ones
```

the gamma rate is built by taking the **most** common digit at each index; the epsilon rate by taking the **least** common one.

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

for the second part, keep filtering by the most or least common digit at each index until only one number remains.

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

</details>

<details class="day">
<summary>day 4 — bingo simulation (python)</summary>

description [here](https://adventofcode.com/2021/day/4), code [here](https://github.com/Ikerlb/AoC2021/tree/master/4).

ok, this was fun! i simulated all boards with a class. the trick was keeping a `rows` and `cols` array on each board with the number of remaining cells until a bingo, so marking a number is O(1) and you immediately know if it triggered a win.

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

for part one, mark each board with the called number and stop on the first bingo. for part two, drop boards as they win and the answer is the last one removed.

</details>

<details class="day">
<summary>day 5 — segment counting (python)</summary>

description [here](https://adventofcode.com/2021/day/5), code [here](https://github.com/Ikerlb/AoC2021/tree/master/5).

nothing fancy: walk from p1 to p2 and add each cell to a counter. for part one, filter out the diagonals; for part two, don't.

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

</details>

<details class="day">
<summary>day 6 — matrix exponentiation (python)</summary>

description [here](https://adventofcode.com/2021/day/6), code [here](https://github.com/Ikerlb/AoC2021/tree/master/6).

this was very fun! my first solution was a linear-time simulation with a deque, which handles both parts comfortably:

```python
# mutates q
def step(q):
    n, last = q[0], q.pop()
    q[-1] += n
    q.append(last)
    q.rotate(-1)
```

then it occurred to me that a single step can be modeled as a matrix multiplication. and if you have repeated matrix multiplication, you have matrix exponentiation. and if you have matrix exponentiation, you have **fast** matrix exponentiation.

the (relatively) hard part was modeling the matrix, but staring at the problem long enough yields:

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

so the second solution is logarithmic on the number of days (aka blazing fast):

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

</details>

<details class="day">
<summary>day 7 — median &amp; average (python)</summary>

description [here](https://adventofcode.com/2021/day/7), code [here](https://github.com/Ikerlb/AoC2021/tree/master/7).

```python
def cost(l, n, f):
    return sum(f(e, n) for e in l)
```

for the first part, the answer is the median:

```python
def median(l):
    return l[len(l) >> 1]

def part1(l):
    m = median(l)
    return cost(l, m, lambda x, y: abs(x - y))
```

for the second part, it's the average (try both floor and ceil):

```python
def part2(l):
    avg = sum(l) / len(l)
    f = lambda x, y: gauss(abs(x - y))
    return min(cost(l, ceil(avg), f), cost(l, floor(avg), f))
```

</details>

<details class="day">
<summary>day 8 — seven-segment permutations (python)</summary>

description [here](https://adventofcode.com/2021/day/8), code [here](https://github.com/Ikerlb/AoC2021/tree/master/8).

for part one, count the words in the output section with lengths 2, 3, 4 or 7.

for part two, i couldn't think of anything cleverer than trying permutations until the wires line up.

</details>

<details class="day">
<summary>day 9 — floodfill (python)</summary>

description [here](https://adventofcode.com/2021/day/9), code [here](https://github.com/Ikerlb/AoC2021/tree/master/9).

for part one, count cells whose neighbors are all strictly greater. for part two, floodfill until you've visited a cell or hit a 9.

```python
def floodfill(grid, r, c):
    if grid[r][c] is None or grid[r][c] == 9:
        return 0
    s, grid[r][c] = 1, None
    for nr, nc in neighbors(grid, r, c):
        s += floodfill(grid, nr, nc)
    return s
```

</details>

<details class="day">
<summary>day 10 — stack-based parsing (python)</summary>

description [here](https://adventofcode.com/2021/day/10), code [here](https://github.com/Ikerlb/AoC2021/tree/master/10).

a stack tells you exactly where a string becomes invalid, if at all:

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

if the stack is non-empty at the end, the string was incomplete and the only way to complete it is to reverse the stack and append it.

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

</details>

<details class="day">
<summary>day 11 — flashing octopuses (python)</summary>

description [here](https://adventofcode.com/2021/day/11), code [here](https://github.com/Ikerlb/AoC2021/tree/master/11).

just simulate the steps; the only thing to be careful about is not counting an octopus more than once per step.

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

</details>

<details class="day">
<summary>day 12 — dfs path counting (python)</summary>

description [here](https://adventofcode.com/2021/day/12), code [here](https://github.com/Ikerlb/AoC2021/tree/master/12).

as long as there are no upper-cased direct loops (eg `A - B`), simple dfs works for both parts.

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

</details>
