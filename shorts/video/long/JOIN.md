# 合并长片

GitHub 单个文件不能超过 100MB，所以成片切成了 5 段。合并后得到 nanjing1937_long.mp4：1920×1080，5 分 41 秒，约 380MB。

**Windows（cmd，在这个文件夹里执行）：**

    copy /b nanjing1937_long.mp4.part0+nanjing1937_long.mp4.part1+nanjing1937_long.mp4.part2+nanjing1937_long.mp4.part3+nanjing1937_long.mp4.part4 nanjing1937_long.mp4

**校验（PowerShell）：**结果应该和 nanjing1937_long.sha256 里的值一样（大小写不同没关系）。

    (Get-FileHash nanjing1937_long.mp4 -Algorithm SHA256).Hash

**macOS / Linux：**

    cat nanjing1937_long.mp4.part* > nanjing1937_long.mp4
