@echo off
powershell -Command "Expand-Archive -Force -Path '%~2' -DestinationPath '%~4'"
