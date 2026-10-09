<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\AdminRepository;

final class AdminService
{
    public function __construct(private readonly AdminRepository $admin)
    {
    }

    public function dashboard(): array { return $this->admin->dashboard(); }
    public function products(?string $search): array { return $this->admin->products($search); }
    public function productOptions(): array { return $this->admin->productOptions(); }
    public function saveProduct(array $input, ?int $id = null): array { return $this->admin->saveProduct($input, $id); }
    public function setProductActive(int $id, bool $active): array { return $this->admin->setProductActive($id, $active); }
    public function coupons(): array { return $this->admin->coupons(); }
    public function saveCoupon(array $input, ?int $id = null): array { return $this->admin->saveCoupon($input, $id); }
    public function setCouponActive(int $id, bool $active): array { return $this->admin->setCouponActive($id, $active); }
    public function content(): array { return $this->admin->content(); }
    public function saveContent(array $input, int $userId): array { return $this->admin->saveContent($input, $userId); }
}
