<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('dao:points:expire')->dailyAt('02:00')->withoutOverlapping();
Schedule::command('dao:points:reconcile')->dailyAt('03:00')->withoutOverlapping();
Schedule::command('dao:birthday-bonus')->dailyAt('08:00')->withoutOverlapping();
Schedule::command('dao:otp:prune')->hourly();
Schedule::command('sanctum:prune-expired --hours=24')->daily();
