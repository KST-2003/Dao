<?php

use Illuminate\Support\Facades\Route;

// DAO is API-only. The web root just identifies the service.
Route::get('/', static fn () => response()->json(['service' => 'dao-api', 'docs' => '/docs/api.md']));
