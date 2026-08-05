<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $userId = is_object($this->route('employee')) ? $this->route('employee')->id : $this->route('employee');

        return [
            'name'      => 'required|string|max:255',
            'username'  => 'required|string|max:255|unique:users,username,' . $userId,
            'email'     => 'required|email|max:255|unique:users,email,' . $userId,
            'phone'     => 'required|string|max:255',
            'id_number' => 'required|string|max:255',
            'job_title' => 'required|string|max:255',
            'is_admin'  => 'required|boolean',
            'avatar'    => 'nullable|image|max:2048',
        ];
    }
}
