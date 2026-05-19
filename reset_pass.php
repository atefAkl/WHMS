<?php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'admin@wms.com')->first();
if(!$user) {
    $user = new User();
    $user->name = 'Admin';
    $user->email = 'admin@wms.com';
}
$user->password = Hash::make('admin123');
$user->save();
echo 'Password reset successfully for ' . $user->email . "\n";
