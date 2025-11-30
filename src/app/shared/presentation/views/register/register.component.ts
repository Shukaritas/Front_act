import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../../../plants/profile/services/profile.services';
import { User } from '../../../../plants/profile/domain/model/profile.entity';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private router = inject(Router);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  registerForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?\d+[\d\s]*$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValues = this.registerForm.value;

    const newUser = new User();
    newUser.userName = formValues.fullName;
    newUser.identificator = formValues.dni;
    newUser.phoneNumber = formValues.phone;
    newUser.email = formValues.email;
    newUser.password = formValues.password;

    this.userService.createUser(newUser).subscribe({
      next: () => {
        alert('Cuenta creada exitosamente. Por favor inicia sesión.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al registrar:', err);
        alert('Hubo un problema al crear la cuenta.');
      }
    });
  }
}
