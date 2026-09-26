<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AddressRequest;
use App\Http\Resources\Api\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return AddressResource::collection($request->user()->addresses()->orderByDesc('is_default')->latest()->get());
    }

    public function store(AddressRequest $request): AddressResource
    {
        return new AddressResource($this->save($request, new Address));
    }

    public function update(AddressRequest $request, int $id): AddressResource
    {
        return new AddressResource($this->save($request, $request->user()->addresses()->findOrFail($id)));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->addresses()->findOrFail($id)->delete();

        return $this->ok(['deleted' => true]);
    }

    private function save(AddressRequest $request, Address $address): Address
    {
        return DB::transaction(function () use ($request, $address) {
            $user = $request->user();
            $isFirst = ! $user->addresses()->exists();
            $address->fill($request->validated());
            $address->is_default = $isFirst || $request->boolean('is_default');
            if ($address->is_default) {
                $user->addresses()->whereKeyNot($address->id ?? 0)->update(['is_default' => false]);
            }
            $address->user()->associate($user)->save();

            return $address;
        });
    }
}
