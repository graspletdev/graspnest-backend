import { Controller, Get, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    findAll() {
        return this.userService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.userService.findOne(+id);
    }
}
