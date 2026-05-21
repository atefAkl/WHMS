<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Models\ContractSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        // Clean up created tenants and database files
        foreach (Tenant::all() as $tenant) {
            $tenant->delete();
        }
        parent::tearDown();
    }

    public function test_tenant_settings_can_be_retrieved_and_stored(): void
    {
        $tenantId = uniqid('tenant_');
        
        // 1. Create a tenant and initialize tenancy
        $tenant = Tenant::create([
            'id' => $tenantId,
        ]);
        $tenant->domains()->create([
            'domain' => 'test.localhost',
        ]);

        tenancy()->initialize($tenant);

        // 2. Create a user inside the tenant
        $user = User::factory()->create();

        // 3. Set some initial settings
        ContractSetting::create([
            'key' => 'company_name',
            'value' => 'Test Company',
        ]);

        // 4. Authenticate the user and access GET /api/settings on the tenant host
        $response = $this->actingAs($user)
            ->get('http://test.localhost/api/settings');

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'company_name' => 'Test Company',
        ]);

        // 5. Update settings via POST /api/settings
        $postResponse = $this->actingAs($user)
            ->postJson('http://test.localhost/api/settings', [
                'company_name' => 'Updated Company Name',
                'company_phone' => '123456789',
            ]);

        $postResponse->assertStatus(200);
        $postResponse->assertJsonFragment([
            'message' => 'Settings updated successfully',
        ]);

        // 6. Verify they were updated in the database
        $this->assertEquals('Updated Company Name', ContractSetting::where('key', 'company_name')->value('value'));
        $this->assertEquals('123456789', ContractSetting::where('key', 'company_phone')->value('value'));
    }
}
